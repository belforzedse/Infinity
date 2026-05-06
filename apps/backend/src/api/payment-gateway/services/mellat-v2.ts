/**
 * Mellat (Beh Pardakht) Payment Gateway Service - Modern HTTP Implementation
 * This version uses simplified HTTP requests instead of complex SOAP parsing
 */

import axios, { AxiosResponse } from "axios";
import { Strapi } from "@strapi/strapi";

interface MellatConfig {
  terminalId: string;
  username: string;
  password: string;
  gatewayUrl: string;
  paymentUrl: string;
}

interface PaymentRequest {
  orderId: number;
  amount: number;
  userId: number;
  callbackURL?: string;
  contractId?: number;
}

interface TransactionParams {
  orderId: string;
  saleOrderId: string;
  saleReferenceId: string;
}

interface PaymentResponse {
  success: boolean;
  refId?: string;
  redirectUrl?: string;
  error?: string;
  requestId: string;
  code?: string;
  message?: string;
  resCode?: number;
}

export default ({ strapi }: { strapi: Strapi }) => ({
  
  /**
   * Get Mellat configuration from environment variables
   */
  getConfig(): MellatConfig {
    return {
      terminalId: process.env.MELLAT_TERMINAL_ID || "MELLAT_TERMINAL_ID",
      username: process.env.MELLAT_USERNAME || "MELLAT_TERMINAL_ID", 
      password: process.env.MELLAT_PASSWORD || "MELLAT_PASSWORD",
      gatewayUrl: process.env.MELLAT_GATEWAY_URL || "https://bpm.shaparak.ir/pgwchannel/services/pgw",
      paymentUrl: process.env.MELLAT_PAYMENT_URL || "https://bpm.shaparak.ir/pgwchannel/startpay.mellat"
    };
  },

  /**
   * Generate unique request ID for tracking
   */
  generateRequestId(prefix: string = "REQ"): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Format callback URL to be absolute
   */
  formatCallbackUrl(callbackURL?: string): string {
    const defaultCallback = "/orders/payment-callback";
    let callbackUrl = callbackURL || defaultCallback;
    
    if (!callbackUrl.startsWith("http")) {
      const baseUrl = strapi.config.get("server.url", "http://localhost:1337");
      callbackUrl = `${baseUrl}${callbackUrl.startsWith("/") ? "" : "/"}${callbackUrl}`;
    }
    
    return callbackUrl;
  },

  /**
   * Generate current date and time for Mellat requests
   */
  getCurrentDateTime() {
    const now = new Date();
    return {
      localDate: now.toISOString().slice(0, 10).replace(/-/g, ""),
      localTime: now.toTimeString().slice(0, 8).replace(/:/g, "")
    };
  },

  /**
   * Create simplified HTTP payload for Mellat (avoiding complex SOAP)
   */
  createPaymentPayload(config: MellatConfig, params: PaymentRequest) {
    const { localDate, localTime } = this.getCurrentDateTime();
    const callbackUrl = this.formatCallbackUrl(params.callbackURL);

    // Use form-urlencoded instead of SOAP XML
    const payload = new URLSearchParams({
      terminalId: config.terminalId,
      userName: config.username,
      userPassword: config.password,
      orderId: params.orderId.toString(),
      amount: params.amount.toString(),
      localDate,
      localTime,
      additionalData: `Contract-${params.contractId || 0}`,
      callBackUrl: callbackUrl,
      payerId: params.userId.toString()
    });

    return { payload, callbackUrl, localDate, localTime };
  },

  /**
   * Make HTTP request to Mellat gateway using form data
   */
  async makeHttpRequest(config: MellatConfig, payload: URLSearchParams, requestId: string): Promise<AxiosResponse> {
    strapi.log.info(`[${requestId}] Making HTTP request to Mellat gateway`);
    
    const startTime = Date.now();
    
    try {
      const response = await axios.post(
        `${config.gatewayUrl}/pay`, // Try REST endpoint first
        payload,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; Infinity-Store/1.0)'
          },
          timeout: 30000,
          validateStatus: (status) => status < 500 // Accept 4xx responses
        }
      );

      const duration = Date.now() - startTime;
      strapi.log.info(`[${requestId}] HTTP response received in ${duration}ms:`, {
        status: response.status,
        contentType: response.headers['content-type']
      });

      return response;

    } catch (error) {
      // If REST endpoint fails, fallback to SOAP but with better handling
      strapi.log.warn(`[${requestId}] REST endpoint failed, trying SOAP fallback`);
      return this.makeSoapFallback(config, payload, requestId);
    }
  },

  /**
   * Fallback to SOAP request with improved error handling
   */
  async makeSoapFallback(config: MellatConfig, payload: URLSearchParams, requestId: string): Promise<AxiosResponse> {
    const { localDate, localTime } = this.getCurrentDateTime();
    
    // Convert URLSearchParams back to individual values for SOAP
    const terminalId = payload.get('terminalId');
    const userName = payload.get('userName');
    const userPassword = payload.get('userPassword');
    const orderId = payload.get('orderId');
    const amount = payload.get('amount');
    const callBackUrl = payload.get('callBackUrl');
    const payerId = payload.get('payerId');
    const additionalData = payload.get('additionalData');

    // Create minimal SOAP request
    const soapXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <bpPayRequest xmlns="http://interfaces.core.sw.bps.com/">
      <terminalId>${terminalId}</terminalId>
      <userName>${userName}</userName>
      <userPassword>${userPassword}</userPassword>
      <orderId>${orderId}</orderId>
      <amount>${amount}</amount>
      <localDate>${localDate}</localDate>
      <localTime>${localTime}</localTime>
      <additionalData>${additionalData}</additionalData>
      <callBackUrl>${callBackUrl}</callBackUrl>
      <payerId>${payerId}</payerId>
    </bpPayRequest>
  </soap:Body>
</soap:Envelope>`;

    strapi.log.debug(`[${requestId}] SOAP fallback request:`, { soapXml });

    return axios.post(
      config.gatewayUrl,
      soapXml,
      {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': ''
        },
        timeout: 30000
      }
    );
  },

  /**
   * Parse response from Mellat gateway
   */
  parsePaymentResponse(response: AxiosResponse, requestId: string): { refId?: string; error?: string } {
    try {
      const data = response.data;
      
      // Try JSON response first (REST API)
      if (typeof data === 'object' && data.refId) {
        strapi.log.info(`[${requestId}] Parsed JSON response:`, { refId: data.refId });
        return { refId: data.refId };
      }
      
      // Parse SOAP/XML response
      if (typeof data === 'string') {
        // Extract RefId from SOAP response
        const refIdMatch = data.match(/<return[^>]*>([^<]+)<\/return>/);
        
        if (refIdMatch) {
          const refId = refIdMatch[1].trim();
          strapi.log.info(`[${requestId}] Extracted RefId from SOAP:`, { refId });
          
          // Check for error codes
          if (refId.includes(',') || parseInt(refId) < 0) {
            return { error: `Gateway error code: ${refId}` };
          }
          
          if (refId && refId.length >= 5) {
            return { refId };
          }
        }
      }
      
      return { error: "Could not parse payment response" };
      
    } catch (error) {
      strapi.log.error(`[${requestId}] Parse error:`, error);
      return { error: `Response parse error: ${error.message}` };
    }
  },

  /**
   * Log Mellat error codes with Persian descriptions
   */
  logMellatErrorCode(requestId: string, resCode: number): void {
    const errorCodes: { [key: number]: string } = {
      11: "شماره کارت نامعتبر است - Invalid card number",
      12: "موجودی کافی نیست - Insufficient balance",
      13: "رمز نادرست است - Incorrect password",
      14: "تعداد دفعات وارد کردن رمز بیش از حد مجاز است - Too many password attempts",
      15: "کارت نامعتبر است - Invalid card",
      16: "دفعات برداشت وجه بیش از حد مجاز است - Withdrawal frequency exceeded",
      17: "کاربر از انجام تراکنش منصرف شده است - User cancelled transaction",
      18: "تاریخ انقضای کارت گذشته است - Card expired",
      19: "مبلغ برداشت وجه بیش از حد مجاز است - Withdrawal amount exceeds limit",
      21: "پذیرنده نامعتبر است - Invalid merchant",
      23: "خطای امنیتی رخ داده است - Security error",
      24: "اطلاعات کاربری پذیرنده نامعتبر است - Invalid merchant user info",
      25: "مبلغ نامعتبر است - Invalid amount",
      31: "پاسخ نامعتبر است - Invalid response",
      32: "فرمت اطلاعات وارد شده صحیح نمی‌باشد - Invalid data format",
      33: "حساب نامعتبر است - Invalid account",
      34: "خطای سیستمی - System error",
      35: "تاریخ نامعتبر است - Invalid date",
      41: "شماره درخواست تکراری است - Duplicate request number",
      42: "تراکنش Sale یافت نشد - Sale transaction not found",
      43: "قبلا درخواست Verify داده شده است - Verify request already submitted",
      44: "درخواست Verify یافت نشد - Verify request not found",
      45: "تراکنش Settle شده است - Transaction already settled",
      46: "تراکنش Settle نشده است - Transaction not settled",
      47: "تراکنش Settle یافت نشد - Settle transaction not found",
      48: "تراکنش Reverse شده است - Transaction reversed",
      49: "تراکنش Refund یافت نشد - Refund transaction not found",
      51: "تراکنش تکراری است - Duplicate transaction",
      54: "تراکنش مرجع موجود نیست - Reference transaction not found",
      55: "تراکنش نامعتبر است - Invalid transaction",
      61: "خطا در واریز - Deposit error",
      62: "مسیر بازگشت به سایت در دامنه ثبت شده برای پذیرنده قرار ندارد - Return URL not in registered domain",
      98: "سقف استفاده از رمز ایستا به پایان رسیده است - Static password usage limit reached",
      111: "صادر کننده کارت نامعتبر است - Invalid card issuer",
      112: "خطای سوییچ صادر کننده کارت - Card issuer switch error",
      113: "پاسخی از صادر کننده کارت دریافت نشد - No response from card issuer",
      114: "دارنده کارت مجاز به انجام این تراکنش نیست - Cardholder not authorized",
      412: "شناسه قبض نادرست است - Invalid bill identifier",
      413: "شناسه پرداخت نادرست است - Invalid payment identifier",
      414: "سازمان صادر کننده قبض نامعتبر است - Invalid bill issuer",
      415: "زمان جلسه کاری به پایان رسیده است - Session timeout",
      416: "خطا در ثبت اطلاعات - Data registration error",
      417: "شناسه پرداخت کننده نامعتبر است - Invalid payer identifier",
      418: "اشکال در تعریف اطلاعات مشتری - Customer data definition error",
      419: "تعداد دفعات ورود اطلاعات از حد مجاز گذشته است - Data entry attempts exceeded",
      421: "IP نامعتبر است - Invalid IP address",
    };

    const meaning = errorCodes[resCode] || `Unknown error code: ${resCode}`;
    strapi.log.error(`[${requestId}] Mellat Error Code ${resCode}: ${meaning}`);
  },

  /**
   * Main payment request method with retry logic
   */
  async requestPayment(params: PaymentRequest): Promise<PaymentResponse> {
    const requestId = this.generateRequestId();
    const maxRetries = 2;
    let lastError: any = null;
    const startTime = Date.now();

    try {
      const config = this.getConfig();

      strapi.log.info(`[${requestId}] ========== MELLAT PAYMENT REQUEST START ==========`);
      strapi.log.info(`[${requestId}] Starting Mellat payment request:`, {
        orderId: params.orderId,
        amount: params.amount,
        userId: params.userId,
        maxRetries
      });

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          strapi.log.info(`[${requestId}] [ATTEMPT ${attempt}/${maxRetries}] Creating payment payload...`);

          // Create payment payload
          const { payload, callbackUrl } = this.createPaymentPayload(config, params);

          // Make HTTP request
          const response = await this.makeHttpRequest(config, payload, requestId);

          // Parse response
          const parsed = this.parsePaymentResponse(response, requestId);

          if (parsed.error) {
            strapi.log.warn(`[${requestId}] [ATTEMPT ${attempt}/${maxRetries}] Payment request failed:`, parsed.error);
            lastError = new Error(parsed.error);

            if (attempt < maxRetries) {
              const delayMs = Math.pow(2, attempt - 1) * 1000;
              strapi.log.info(`[${requestId}] Waiting ${delayMs}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
              continue;
            }

            return {
              success: false,
              error: parsed.error,
              requestId
            };
          }

          if (parsed.refId) {
            const redirectUrl = `${config.paymentUrl}?RefId=${parsed.refId}`;
            const duration = Date.now() - startTime;

            strapi.log.info(`[${requestId}] ========== PAYMENT REQUEST SUCCESSFUL (${duration}ms) ==========`, {
              refId: parsed.refId,
              redirectUrl
            });

            return {
              success: true,
              refId: parsed.refId,
              redirectUrl,
              requestId,
              message: "Payment request successful"
            };
          }

          // Unknown response, retry
          lastError = new Error("Unknown response format");
          if (attempt < maxRetries) {
            const delayMs = Math.pow(2, attempt - 1) * 1000;
            strapi.log.info(`[${requestId}] Unknown response, waiting ${delayMs}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            continue;
          }

          return {
            success: false,
            error: "Unknown response format",
            requestId
          };

        } catch (attemptError) {
          lastError = attemptError;
          const duration = Date.now() - startTime;

          strapi.log.error(`[${requestId}] [ATTEMPT ${attempt}/${maxRetries}] Exception after ${duration}ms:`, {
            message: attemptError.message,
            code: attemptError.code,
            status: attemptError.response?.status,
            willRetry: attempt < maxRetries
          });

          if (attempt === maxRetries) {
            const totalDuration = Date.now() - startTime;
            strapi.log.error(`[${requestId}] ========== PAYMENT REQUEST FAILED AFTER ${maxRetries} ATTEMPTS (${totalDuration}ms) ==========`, {
              message: attemptError.message,
              code: attemptError.code
            });

            return {
              success: false,
              error: attemptError.message || "Payment request failed after retries",
              requestId,
              code: attemptError.code
            };
          }

          // Wait before retrying
          const delayMs = Math.pow(2, attempt - 1) * 1000;
          strapi.log.info(`[${requestId}] Waiting ${delayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      // Fallback (should not reach here)
      const totalDuration = Date.now() - startTime;
      strapi.log.error(`[${requestId}] ========== PAYMENT REQUEST UNEXPECTED FAILURE (${totalDuration}ms) ==========`);

      return {
        success: false,
        error: lastError?.message || "Payment request failed",
        requestId,
        code: lastError?.code
      };

    } catch (error) {
      const totalDuration = Date.now() - startTime;
      strapi.log.error(`[${requestId}] ========== PAYMENT REQUEST EXCEPTION (${totalDuration}ms) ==========`, {
        message: error.message,
        code: error.code
      });

      return {
        success: false,
        error: error.message || "Payment request failed",
        requestId,
        code: error.code
      };
    }
  },

  /**
   * Create SOAP request for verification
   */
  createVerifySOAP(config: MellatConfig, params: TransactionParams): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <bpVerifyRequest xmlns="http://interfaces.core.sw.bps.com/">
      <terminalId>${config.terminalId}</terminalId>
      <userName>${config.username}</userName>
      <userPassword>${config.password}</userPassword>
      <orderId>${params.orderId}</orderId>
      <saleOrderId>${params.saleOrderId}</saleOrderId>
      <saleReferenceId>${params.saleReferenceId}</saleReferenceId>
    </bpVerifyRequest>
  </soap:Body>
</soap:Envelope>`;
  },

  /**
   * Create SOAP request for settlement
   */
  createSettleSOAP(config: MellatConfig, params: TransactionParams): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <bpSettleRequest xmlns="http://interfaces.core.sw.bps.com/">
      <terminalId>${config.terminalId}</terminalId>
      <userName>${config.username}</userName>
      <userPassword>${config.password}</userPassword>
      <orderId>${params.orderId}</orderId>
      <saleOrderId>${params.saleOrderId}</saleOrderId>
      <saleReferenceId>${params.saleReferenceId}</saleReferenceId>
    </bpSettleRequest>
  </soap:Body>
</soap:Envelope>`;
  },

  /**
   * Create SOAP request for reversal
   */
  createReverseSOAP(config: MellatConfig, params: TransactionParams): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <bpReversalRequest xmlns="http://interfaces.core.sw.bps.com/">
      <terminalId>${config.terminalId}</terminalId>
      <userName>${config.username}</userName>
      <userPassword>${config.password}</userPassword>
      <orderId>${params.orderId}</orderId>
      <saleOrderId>${params.saleOrderId}</saleOrderId>
      <saleReferenceId>${params.saleReferenceId}</saleReferenceId>
    </bpReversalRequest>
  </soap:Body>
</soap:Envelope>`;
  },

  /**
   * Create SOAP request for inquiry
   */
  createInquirySOAP(config: MellatConfig, params: TransactionParams): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <bpInquiryRequest xmlns="http://interfaces.core.sw.bps.com/">
      <terminalId>${config.terminalId}</terminalId>
      <userName>${config.username}</userName>
      <userPassword>${config.password}</userPassword>
      <orderId>${params.orderId}</orderId>
      <saleOrderId>${params.saleOrderId}</saleOrderId>
      <saleReferenceId>${params.saleReferenceId}</saleReferenceId>
    </bpInquiryRequest>
  </soap:Body>
</soap:Envelope>`;
  },

  /**
   * Parse SOAP response to extract response code
   */
  parseSOAPResponse(response: AxiosResponse, requestId: string): number {
    try {
      const data = response.data;

      if (typeof data === 'object' && data.resCode !== undefined) {
        return Number(data.resCode);
      }

      if (typeof data === 'string') {
        // Extract response code from SOAP response
        const match = data.match(/<return[^>]*>([^<]+)<\/return>/);
        if (match) {
          return Number(match[1].trim());
        }
      }

      return -1; // Unknown response
    } catch (error) {
      strapi.log.error(`[${requestId}] Failed to parse SOAP response:`, error.message);
      return -1;
    }
  },

  /**
   * Verify transaction after payment
   */
  async verifyTransaction(params: TransactionParams): Promise<PaymentResponse> {
    const requestId = this.generateRequestId("VERIFY");

    try {
      const config = this.getConfig();

      strapi.log.info(`[${requestId}] Starting transaction verification:`, {
        orderId: params.orderId,
        saleOrderId: params.saleOrderId,
        saleReferenceId: params.saleReferenceId,
      });

      const soapXml = this.createVerifySOAP(config, params);

      const response = await axios.post(
        config.gatewayUrl,
        soapXml,
        {
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': ''
          },
          timeout: 30000
        }
      );

      const resCode = this.parseSOAPResponse(response, requestId);

      strapi.log.info(`[${requestId}] Verification response:`, {
        resCode,
        success: resCode === 0,
      });

      if (resCode === 0) {
        return {
          success: true,
          message: "Transaction verified successfully",
          resCode,
          requestId,
        };
      } else {
        this.logMellatErrorCode(requestId, resCode);

        return {
          success: false,
          error: `Verification failed with code: ${resCode}`,
          resCode,
          requestId,
        };
      }
    } catch (error) {
      strapi.log.error(`[${requestId}] Error in transaction verification:`, {
        message: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        error: error.message || "Verification failed",
        requestId,
      };
    }
  },

  /**
   * Settle (finalize) payment transaction
   */
  async settleTransaction(params: TransactionParams): Promise<PaymentResponse> {
    const requestId = this.generateRequestId("SETTLE");

    try {
      const config = this.getConfig();

      strapi.log.info(`[${requestId}] Starting transaction settlement:`, {
        orderId: params.orderId,
        saleOrderId: params.saleOrderId,
        saleReferenceId: params.saleReferenceId,
      });

      const soapXml = this.createSettleSOAP(config, params);

      const response = await axios.post(
        config.gatewayUrl,
        soapXml,
        {
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': ''
          },
          timeout: 30000
        }
      );

      const resCode = this.parseSOAPResponse(response, requestId);

      strapi.log.info(`[${requestId}] Settlement response:`, {
        resCode,
        success: resCode === 0 || resCode === 45,
      });

      if (resCode === 0) {
        return {
          success: true,
          message: "Transaction settled successfully",
          resCode,
          requestId,
        };
      } else if (resCode === 45) {
        return {
          success: true,
          message: "Transaction already settled",
          resCode,
          requestId,
        };
      } else {
        this.logMellatErrorCode(requestId, resCode);

        return {
          success: false,
          error: `Settlement failed with code: ${resCode}`,
          resCode,
          requestId,
        };
      }
    } catch (error) {
      strapi.log.error(`[${requestId}] Error in transaction settlement:`, {
        message: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        error: error.message || "Settlement failed",
        requestId,
      };
    }
  },

  /**
   * Reverse (cancel) payment transaction
   */
  async reverseTransaction(params: TransactionParams): Promise<PaymentResponse> {
    const requestId = this.generateRequestId("REVERSE");

    try {
      const config = this.getConfig();

      strapi.log.info(`[${requestId}] Starting transaction reversal:`, {
        orderId: params.orderId,
        saleOrderId: params.saleOrderId,
        saleReferenceId: params.saleReferenceId,
      });

      const soapXml = this.createReverseSOAP(config, params);

      const response = await axios.post(
        config.gatewayUrl,
        soapXml,
        {
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': ''
          },
          timeout: 30000
        }
      );

      const resCode = this.parseSOAPResponse(response, requestId);

      strapi.log.info(`[${requestId}] Reversal response:`, {
        resCode,
        success: resCode === 0,
      });

      if (resCode === 0) {
        return {
          success: true,
          message: "Transaction reversed successfully",
          resCode,
          requestId,
        };
      } else {
        this.logMellatErrorCode(requestId, resCode);

        return {
          success: false,
          error: `Reversal failed with code: ${resCode}`,
          resCode,
          requestId,
        };
      }
    } catch (error) {
      strapi.log.error(`[${requestId}] Error in transaction reversal:`, {
        message: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        error: error.message || "Reversal failed",
        requestId,
      };
    }
  },

  /**
   * Inquiry payment status
   */
  async inquiryTransaction(params: TransactionParams): Promise<PaymentResponse> {
    const requestId = this.generateRequestId("INQUIRY");

    try {
      const config = this.getConfig();

      strapi.log.info(`[${requestId}] Starting transaction inquiry:`, {
        orderId: params.orderId,
        saleOrderId: params.saleOrderId,
        saleReferenceId: params.saleReferenceId,
      });

      const soapXml = this.createInquirySOAP(config, params);

      const response = await axios.post(
        config.gatewayUrl,
        soapXml,
        {
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': ''
          },
          timeout: 30000
        }
      );

      const resCode = this.parseSOAPResponse(response, requestId);

      strapi.log.info(`[${requestId}] Inquiry response:`, {
        resCode,
      });

      // For inquiry, we just return the status
      return {
        success: true,
        message: `Payment status: ${resCode}`,
        resCode,
        requestId,
      };
    } catch (error) {
      strapi.log.error(`[${requestId}] Error in transaction inquiry:`, {
        message: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        error: error.message || "Inquiry failed",
        requestId,
      };
    }
  }

}); 