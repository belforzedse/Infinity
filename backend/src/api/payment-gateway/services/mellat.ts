/**
 * Mellat (Beh Pardakht) payment gateway service - Updated Implementation
 */

import axios from "axios";
import { Strapi } from "@strapi/strapi";

interface MellatPaymentParams {
  orderId: number;
  amount: number;
  userId: number;
  callbackURL: string;
  contractId?: number;
}

interface MellatVerifyParams {
  orderId: string;
  saleOrderId: string;
  saleReferenceId: string;
}

export default ({ strapi }: { strapi: Strapi }) => ({
  async requestPayment(params: MellatPaymentParams) {
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Use environment variables for credentials with fallback to hardcoded values
      const terminalId = process.env.MELLAT_TERMINAL_ID || "MELLAT_TERMINAL_ID";
      const username = process.env.MELLAT_USERNAME || "MELLAT_TERMINAL_ID";
      const password = process.env.MELLAT_PASSWORD || "MELLAT_PASSWORD";
      const gatewayUrl = process.env.MELLAT_GATEWAY_URL || "https://bpm.shaparak.ir/pgwchannel/services/pgw";
      const defaultCallbackURL = "/orders/payment-callback";

      // Log configuration (without sensitive data)
      strapi.log.info(`[${requestId}] Mellat Gateway Configuration:`, {
        terminalId: terminalId.slice(0, 3) + "****",
        username: username.slice(0, 3) + "****", 
        gatewayUrl,
        usingEnvCredentials: {
          terminal: !!process.env.MELLAT_TERMINAL_ID,
          username: !!process.env.MELLAT_USERNAME,
          password: !!process.env.MELLAT_PASSWORD
        }
      });

      // Convert callback URL if it's a relative path
      let callbackUrl = params.callbackURL || defaultCallbackURL;
      if (callbackUrl && !callbackUrl.startsWith("http")) {
        const baseUrl = strapi.config.get(
          "server.url",
          "http://localhost:1337"
        );
        callbackUrl = `${baseUrl}${
          callbackUrl.startsWith("/") ? "" : "/"
        }${callbackUrl}`;
      }

      // Generate date/time for request
      const currentDate = new Date();
      const localDate = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
      const localTime = currentDate.toTimeString().slice(0, 8).replace(/:/g, "");

      // Create SOAP XML request for payment with strict namespace handling
      const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <bpPayRequest xmlns="http://interfaces.core.sw.bps.com/">
      <terminalId>${terminalId}</terminalId>
      <userName>${username}</userName>
      <userPassword>${password}</userPassword>
      <orderId>${params.orderId}</orderId>
      <amount>${params.amount}</amount>
      <localDate>${localDate}</localDate>
      <localTime>${localTime}</localTime>
      <additionalData>Contract-${params.contractId || 0}</additionalData>
      <callBackUrl>${callbackUrl}</callBackUrl>
      <payerId>${params.userId}</payerId>
    </bpPayRequest>
  </soap:Body>
</soap:Envelope>`;

      strapi.log.info(`[${requestId}] Making Mellat payment request:`, {
        orderId: params.orderId,
        amount: params.amount,
        callbackUrl,
        userId: params.userId,
        localDate,
        localTime,
        contractId: params.contractId
      });

      strapi.log.debug(`[${requestId}] SOAP Request XML:`, soapEnvelope);

      // Make SOAP request to Mellat gateway
      const requestStartTime = Date.now();
      strapi.log.info(`[${requestId}] Sending request to: ${gatewayUrl}`);

      const response = await axios.post(
        gatewayUrl,
        soapEnvelope,
        {
          headers: {
            "Content-Type": "text/xml; charset=utf-8",
            SOAPAction: "",
          },
          timeout: 30000, // 30 second timeout
        }
      );

      const requestDuration = Date.now() - requestStartTime;
      strapi.log.info(`[${requestId}] Mellat response received in ${requestDuration}ms:`, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataLength: response.data?.length || 0
      });

      strapi.log.debug(`[${requestId}] Full Mellat response data:`, response.data);

      // Parse SOAP response
      const responseData = response.data;

      // Extract RefId from SOAP response
      const refIdMatch = responseData.match(/<return[^>]*>([^<]+)<\/return>/);

      if (!refIdMatch) {
        const error = new Error("Could not parse RefId from Mellat response");
        strapi.log.error(`[${requestId}] Parse error:`, {
          error: error.message,
          responseData: responseData?.substring(0, 500) + "..." // Log first 500 chars
        });
        throw error;
      }

      const refId = refIdMatch[1];
      strapi.log.info(`[${requestId}] Extracted RefId: "${refId}"`);

      // Check if response contains error
      if (refId.includes(",") || parseInt(refId) < 0) {
        const errorMessage = `Mellat gateway error: ${refId}`;
        strapi.log.error(`[${requestId}] Gateway error detected:`, {
          refId,
          errorCode: refId,
          errorType: "MELLAT_GATEWAY_ERROR"
        });
        
        // Try to decode error for logging
        this.logMellatErrorCode(requestId, refId);
        
        throw new Error(errorMessage);
      }

      // Validate RefId
      if (!refId || refId.length < 5) {
        const error = new Error(`Invalid RefId received: ${refId}`);
        strapi.log.error(`[${requestId}] Invalid RefId:`, {
          refId,
          refIdLength: refId?.length,
          errorType: "INVALID_REFID"
        });
        throw error;
      }

      // Generate redirect URL to Mellat payment page
      const redirectUrl = `https://bpm.shaparak.ir/pgwchannel/startpay.mellat?RefId=${refId}`;

      strapi.log.info(`[${requestId}] Mellat payment request successful:`, {
        refId,
        redirectUrl,
        success: true
      });

      return {
        success: true,
        refId,
        redirectUrl,
        requestId, // Include for tracking
      };
    } catch (error) {
      strapi.log.error(`[${requestId}] Error in Mellat payment request:`, {
        message: error.message,
        stack: error.stack,
        code: error.code,
        response: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          headers: error.response?.headers,
          data: error.response?.data
        },
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout,
          headers: error.config?.headers
        }
      });

      // Create detailed error for frontend
      const detailedError = {
        requestId,
        type: "MELLAT_REQUEST_ERROR",
        message: error.message,
        code: error.code,
        httpStatus: error.response?.status,
        httpStatusText: error.response?.statusText,
        responseData: error.response?.data,
        timestamp: new Date().toISOString(),
        // Additional debugging info
        debug: {
          gatewayUrl: error.config?.url,
          timeout: error.config?.timeout,
          hasResponse: !!error.response,
          hasRequest: !!error.request,
          isNetworkError: !error.response && !!error.request,
          isRequestError: !!error.response
        }
      };

      return {
        success: false,
        error: error.message || "Payment gateway connection error",
        detailedError, // Include full details for debugging
        requestId
      };
    }
  },

  // Helper method to log error codes
  logMellatErrorCode(requestId: string, errorCode: string) {
    const errorCodes = {
      "11": "شماره کارت نامعتبر است - Invalid card number",
      "12": "موجودی کافی نیست - Insufficient balance", 
      "13": "رمز نادرست است - Incorrect password",
      "14": "تعداد دفعات وارد کردن رمز بیش از حد مجاز است - Too many password attempts",
      "15": "کارت نامعتبر است - Invalid card",
      "16": "وجه برداشت بیش از حد مجاز است - Withdrawal amount exceeds limit",
      "17": "کاربر از انجام تراکنش منصرف شده است - User cancelled transaction",
      "18": "تاریخ انقضای کارت گذشته است - Card expired",
      "19": "مبلغ برداشت بیش از حد مجاز است - Withdrawal amount exceeds daily limit",
      "21": "پذیرنده نامعتبر است - Invalid merchant",
      "23": "خطای امنیتی رخ داده است - Security error",
      "24": "اطلاعات کاربری پذیرنده نامعتبر است - Invalid merchant user info",
      "25": "مبلغ نامعتبر است - Invalid amount",
      "31": "پاسخ نامعتبر است - Invalid response",
      "32": "فرمت اطلاعات وارد شده صحیح نمی‌باشد - Invalid data format",
      "33": "حساب نامعتبر است - Invalid account",
      "34": "خطای سیستمی - System error",
      "35": "تاریخ نامعتبر است - Invalid date",
      "41": "شماره درخواست تکراری است - Duplicate request number",
      "42": "تراکنش Sale یافت نشد - Sale transaction not found",
      "43": "قبلا درخواست Verify داده شده است - Verify request already submitted",
      "44": "درخواست Verify یافت نشد - Verify request not found",
      "45": "تراکنش Settle شده است - Transaction already settled",
      "46": "تراکنش Settle نشده است - Transaction not settled",
      "47": "تراکنش Settle یافت نشد - Settle transaction not found",
      "48": "تراکنش Reverse شده است - Transaction reversed",
      "49": "تراکنش Refund یافت نشد - Refund transaction not found",
      "421": "IP نامعتبر است - Invalid IP address"
    };

    const code = errorCode.toString();
    const meaning = errorCodes[code] || `Unknown error code: ${code}`;
    
    strapi.log.error(`[${requestId}] Mellat Error Code ${code}: ${meaning}`);
  },

  async verifyTransaction(transactionParams: MellatVerifyParams) {
    const requestId = `VERIFY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const terminalId = process.env.MELLAT_TERMINAL_ID || "MELLAT_TERMINAL_ID";
      const username = process.env.MELLAT_USERNAME || "MELLAT_TERMINAL_ID";
      const password = process.env.MELLAT_PASSWORD || "MELLAT_PASSWORD";
      const gatewayUrl = process.env.MELLAT_GATEWAY_URL || "https://bpm.shaparak.ir/pgwchannel/services/pgw";

      const { orderId, saleOrderId, saleReferenceId } = transactionParams;

      strapi.log.info(`[${requestId}] Starting transaction verification:`, {
        orderId,
        saleOrderId,
        saleReferenceId
      });

      // Create SOAP XML request for verification
      const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <bpVerifyRequest xmlns="http://interfaces.core.sw.bps.com/">
      <terminalId>${terminalId}</terminalId>
      <userName>${username}</userName>
      <userPassword>${password}</userPassword>
      <orderId>${orderId}</orderId>
      <saleOrderId>${saleOrderId}</saleOrderId>
      <saleReferenceId>${saleReferenceId}</saleReferenceId>
    </bpVerifyRequest>
  </soap:Body>
</soap:Envelope>`;

      strapi.log.debug(`[${requestId}] Verification SOAP request:`, soapEnvelope);

      const response = await axios.post(
        gatewayUrl,
        soapEnvelope,
        {
          headers: {
            "Content-Type": "text/xml; charset=utf-8",
            SOAPAction: "",
          },
          timeout: 30000,
        }
      );

      strapi.log.info(`[${requestId}] Verification response:`, {
        status: response.status,
        data: response.data
      });

      // Parse SOAP response
      const responseData = response.data;
      const resultMatch = responseData.match(/<return[^>]*>([^<]+)<\/return>/);

      if (!resultMatch) {
        throw new Error("Could not parse result from Mellat verify response");
      }

      const resCode = parseInt(resultMatch[1]);
      strapi.log.info(`[${requestId}] Verification result code: ${resCode}`);

      if (resCode === 0) {
        return {
          success: true,
          message: "Transaction verified successfully",
          resCode,
          requestId
        };
      } else {
        this.logMellatErrorCode(requestId, resCode.toString());
        return {
          success: false,
          error: `Verification failed with code: ${resCode}`,
          resCode,
          requestId
        };
      }
    } catch (error) {
      strapi.log.error(`[${requestId}] Error in Mellat transaction verification:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Verification request failed",
        requestId,
        detailedError: {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        }
      };
    }
  },

  async settleTransaction(transactionParams: MellatVerifyParams) {
    const requestId = `SETTLE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const terminalId = process.env.MELLAT_TERMINAL_ID || "MELLAT_TERMINAL_ID";
      const username = process.env.MELLAT_USERNAME || "MELLAT_TERMINAL_ID";
      const password = process.env.MELLAT_PASSWORD || "MELLAT_PASSWORD";
      const gatewayUrl = process.env.MELLAT_GATEWAY_URL || "https://bpm.shaparak.ir/pgwchannel/services/pgw";

      const { orderId, saleOrderId, saleReferenceId } = transactionParams;

      strapi.log.info(`[${requestId}] Starting transaction settlement:`, {
        orderId,
        saleOrderId,
        saleReferenceId
      });

      // Create SOAP XML request for settlement
      const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <bpSettleRequest xmlns="http://interfaces.core.sw.bps.com/">
      <terminalId>${terminalId}</terminalId>
      <userName>${username}</userName>
      <userPassword>${password}</userPassword>
      <orderId>${orderId}</orderId>
      <saleOrderId>${saleOrderId}</saleOrderId>
      <saleReferenceId>${saleReferenceId}</saleReferenceId>
    </bpSettleRequest>
  </soap:Body>
</soap:Envelope>`;

      strapi.log.debug(`[${requestId}] Settlement SOAP request:`, soapEnvelope);

      const response = await axios.post(
        gatewayUrl,
        soapEnvelope,
        {
          headers: {
            "Content-Type": "text/xml; charset=utf-8",
            SOAPAction: "",
          },
          timeout: 30000,
        }
      );

      strapi.log.info(`[${requestId}] Settlement response:`, {
        status: response.status,
        data: response.data
      });

      // Parse SOAP response
      const responseData = response.data;
      const resultMatch = responseData.match(/<return[^>]*>([^<]+)<\/return>/);

      if (!resultMatch) {
        throw new Error("Could not parse result from Mellat settle response");
      }

      const resCode = parseInt(resultMatch[1]);
      strapi.log.info(`[${requestId}] Settlement result code: ${resCode}`);

      if (resCode === 0) {
        return {
          success: true,
          message: "Transaction settled successfully",
          resCode,
          requestId
        };
      } else if (resCode === 45) {
        return {
          success: true,
          message: "Transaction already settled",
          resCode,
          requestId
        };
      } else {
        this.logMellatErrorCode(requestId, resCode.toString());
        return {
          success: false,
          error: `Settlement failed with code: ${resCode}`,
          resCode,
          requestId
        };
      }
    } catch (error) {
      strapi.log.error(`[${requestId}] Error in Mellat transaction settlement:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Settlement request failed",
        requestId,
        detailedError: {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        }
      };
    }
  }
});
