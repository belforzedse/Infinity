/**
 * Mellat (Behpardakht) Payment Gateway Service - Using mellat-checkout package
 * This implementation uses the official mellat-checkout npm package for better reliability
 */

import MellatCheckout from "mellat-checkout";
import { Strapi } from "@strapi/strapi";

interface MellatPaymentParams {
  orderId: number;
  amount: number;
  userId: number;
  callbackURL: string;
  contractId?: number;
  amountInRial?: boolean;
  includePayerId?: boolean;
}

const normalizeNumericParam = (value: any): number | string => {
  const num = Number(value);
  return Number.isNaN(num) ? value : num;
};

interface MellatVerifyParams {
  orderId: string;
  saleOrderId: string;
  saleReferenceId: string;
  allowResCode45Success?: boolean;
}

interface PaymentResponse {
  success: boolean;
  refId?: string;
  redirectUrl?: string;
  error?: string;
  requestId?: string;
  resCode?: number;
  message?: string;
  errorCode?: string;
  errorErrno?: number;
}

export default ({ strapi }: { strapi: Strapi }) => ({
  /**
   * Get Mellat configuration and create client instance
   */
  createMellatClient() {
    const rawApiUrl =
      process.env.MELLAT_GATEWAY_URL ||
      "https://bpm.shaparak.ir/pgwchannel/services/pgw?wsdl";

    const sanitized = rawApiUrl.trim();
    const apiUrl = sanitized.includes("?wsdl")
      ? sanitized
      : `${sanitized.replace(/\/$/, "")}?wsdl`;

    strapi.log.info("[Mellat] Creating client with URL:", { apiUrl });

    const terminalId = process.env.MELLAT_TERMINAL_ID;
    const username = process.env.MELLAT_USERNAME;
    const password = process.env.MELLAT_PASSWORD;

    if (!terminalId || !username || !password) {
      throw new Error(
        "Mellat gateway credentials not configured: missing MELLAT_TERMINAL_ID, MELLAT_USERNAME, or MELLAT_PASSWORD"
      );
    }

    const config = {
      terminalId,
      username,
      password,
      timeout: 120000, // 120 seconds timeout
      apiUrl,
    };

    return new MellatCheckout(config);
  },

  /**
   * Format callback URL to be absolute
   */
  formatCallbackUrl(callbackURL?: string): string {
    // Get production callback URL from environment with fallback
    const baseUrl =
      process.env.URL || "https://api.infinitycolor.co/";
    const productionCallback = `${baseUrl.replace(/\/$/, "")}/api/orders/payment-callback`;

    // If a custom callback is provided and it's absolute, use it
    if (callbackURL && callbackURL.startsWith("http")) {
      return callbackURL;
    }

    // Otherwise, use the production callback from environment
    return productionCallback;
  },

  /**
   * Generate unique request ID for tracking
   */
  generateRequestId(prefix: string = "REQ"): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Log Mellat error codes with Persian descriptions
   */
  logMellatErrorCode(requestId: string, resCode: number): void {
    const errorCodes = {
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
   * Request payment from Mellat gateway with retry logic
   */
  async requestPayment(params: MellatPaymentParams): Promise<PaymentResponse> {
    const requestId = this.generateRequestId();
    const maxRetries = 3; // allow 2 retries (total 3 attempts) to match spec
    let lastError: any = null;
    const startTime = Date.now();
    const amountRial = Math.round(
      params.amountInRial ? params.amount : params.amount * 10
    ); // convert Toman → Rial unless flagged as IRR

    strapi.log.info(`[${requestId}] ========== MELLAT PAYMENT REQUEST START ==========`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const attemptStartTime = Date.now();
        strapi.log.info(`[${requestId}] [ATTEMPT ${attempt}/${maxRetries}] Creating Mellat client...`);

        const mellat = this.createMellatClient();
        const callbackUrl = this.formatCallbackUrl(params.callbackURL);

        strapi.log.info(`[${requestId}] [ATTEMPT ${attempt}/${maxRetries}] Client created. Request params:`, {
          orderId: params.orderId,
          amount: params.amount,
          userId: params.userId,
          callbackUrl,
          contractId: params.contractId,
        });

        // Initialize the client (with error handling and timing)
        strapi.log.info(`[${requestId}] [ATTEMPT ${attempt}/${maxRetries}] Starting WSDL initialization...`, {
          apiUrl: mellat.config?.apiUrl || 'unknown',
          timeout: mellat.config?.timeout || 'unknown',
        });
        const initStartTime = Date.now();

        let timeoutHandle: NodeJS.Timeout | undefined;
        try {
          strapi.log.debug(`[${requestId}] Calling mellat.initialize()...`);

          // Wrap initialize with explicit promise timeout to ensure it never exceeds our limit
          const initPromise = mellat.initialize();
          const timeoutPromise = new Promise((_, reject) => {
            timeoutHandle = setTimeout(
              () => reject(new Error(`WSDL initialization timeout exceeded 120s`)),
              120000
            );
          });

          await Promise.race([initPromise, timeoutPromise]);
          if (timeoutHandle) clearTimeout(timeoutHandle);
          const initDuration = Date.now() - initStartTime;
          strapi.log.info(`[${requestId}] [ATTEMPT ${attempt}/${maxRetries}] WSDL initialization successful (${initDuration}ms)`);
        } catch (initError) {
          if (timeoutHandle) clearTimeout(timeoutHandle);
          const initDuration = Date.now() - initStartTime;
          strapi.log.error(`[${requestId}] [ATTEMPT ${attempt}/${maxRetries}] WSDL initialization FAILED after ${initDuration}ms:`, {
            errorType: initError?.code || initError?.name,
            message: initError?.message,
            errno: initError?.errno,
            code: initError?.code,
            syscall: initError?.syscall,
            hostname: initError?.hostname,
            stack: initError?.stack?.split('\n')[0],
            note: "Proceeding with payment request anyway..."
          });
          // Continue anyway - sometimes initialization fails but payment still works
        }

        // Request payment using mellat-checkout package
        const paymentRequest: Record<string, unknown> = {
          amount: amountRial,
          orderId: params.orderId,
          callbackUrl: callbackUrl,
        };
        if (params.includePayerId) {
          paymentRequest.payerId = params.userId;
        }

        strapi.log.info(`[${requestId}] [ATTEMPT ${attempt}/${maxRetries}] Sending payment request to Mellat...`, paymentRequest);
        const paymentStartTime = Date.now();

        const response = await mellat.paymentRequest(paymentRequest);

        const paymentDuration = Date.now() - paymentStartTime;
        const resCode = response.ResCode ?? response.resCode;
        const refId = response.RefId ?? response.refId;

        strapi.log.info(`[${requestId}] [ATTEMPT ${attempt}/${maxRetries}] Payment response received in ${paymentDuration}ms:`, {
          resCode,
          refId,
          success: resCode === 0,
        });

        if (resCode === 0 || (resCode === undefined && refId)) {
          // Success - create redirect URL (RefId will be sent via POST form by frontend, similar to wallet flow)
          if (!refId || refId.trim() === "") {
            strapi.log.error(`[${requestId}] RefId is missing from successful response`, {
              resCode,
              response: response,
            });
            throw new Error("RefId not received from Mellat gateway");
          }
          // Return base URL - frontend will send RefId via POST form field (matches wallet topup implementation)
          const redirectUrl = `https://bpm.shaparak.ir/pgwchannel/startpay.mellat`;
          const totalDuration = Date.now() - startTime;

          strapi.log.info(`[${requestId}] ========== PAYMENT REQUEST SUCCESSFUL (${totalDuration}ms) ==========`, {
            refId,
            redirectUrl,
            resCode,
          });

          return {
            success: true,
            refId,
            redirectUrl,
            requestId,
            resCode,
            message: "Payment request successful",
          };
        } else {
          // Error - log the error code
          this.logMellatErrorCode(requestId, resCode);
          const totalDuration = Date.now() - startTime;

          strapi.log.error(`[${requestId}] ========== PAYMENT REQUEST FAILED: Gateway Error ${resCode} (${totalDuration}ms) ==========`);

          return {
            success: false,
            error: `Gateway error: ${resCode}`,
            requestId,
            resCode,
          };
        }
      } catch (error) {
        lastError = error;
        const attemptDuration = Date.now() - startTime;

        strapi.log.warn(
          `[${requestId}] Mellat payment request attempt ${attempt} failed`,
          {
            message: error?.message,
            code: error?.code,
            errno: error?.errno,
          }
        );
        strapi.log.error(`[${requestId}] [ATTEMPT ${attempt}/${maxRetries}] EXCEPTION CAUGHT after ${attemptDuration}ms:`, {
          errorType: error?.code || error?.name || typeof error,
          message: error?.message,
          errno: error?.errno,
          code: error?.code,
          syscall: error?.syscall,
          hostname: error?.hostname,
          port: error?.port,
          address: error?.address,
          attempt,
          willRetry: attempt < maxRetries,
          stack: error?.stack?.split('\n').slice(0, 3).join(' | '),
        });

        // If this was the last attempt, return error
        if (attempt === maxRetries) {
          const totalDuration = Date.now() - startTime;
          strapi.log.error(`[${requestId}] ========== PAYMENT REQUEST FAILED AFTER ${maxRetries} ATTEMPTS (${totalDuration}ms) ==========`, {
            errorType: error?.code || error?.name,
            message: error?.message,
            syscall: error?.syscall,
            hostname: error?.hostname,
            errno: error?.errno,
          });

          return {
            success: false,
            error: error?.message || "Payment request failed after retries",
            requestId,
            errorCode: error?.code,
            errorErrno: error?.errno,
          };
        }

        // Wait before retrying (exponential backoff: 1s, 2s)
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        strapi.log.info(`[${requestId}] [ATTEMPT ${attempt}/${maxRetries}] Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // Fallback (should not reach here)
    const totalDuration = Date.now() - startTime;
    strapi.log.error(`[${requestId}] ========== PAYMENT REQUEST UNEXPECTED FAILURE (${totalDuration}ms) ==========`, {
      message: lastError?.message || "Payment request failed",
    });

    return {
      success: false,
      error: lastError?.message || "Payment request failed",
      requestId,
    };
  },

  /**
   * Verify payment transaction
   */
  async verifyTransaction(
    params: MellatVerifyParams
  ): Promise<PaymentResponse> {
    const requestId = this.generateRequestId("VERIFY");

    try {
      const mellat = this.createMellatClient();

      strapi.log.info(`[${requestId}] Starting transaction verification:`, {
        orderId: params.orderId,
        saleOrderId: params.saleOrderId,
        saleReferenceId: params.saleReferenceId,
      });

      const verifyRequest = {
        orderId: normalizeNumericParam(params.orderId),
        saleOrderId: normalizeNumericParam(params.saleOrderId),
        saleReferenceId: normalizeNumericParam(params.saleReferenceId),
      };

      const response = await mellat.verifyPayment(verifyRequest);

      strapi.log.info(`[${requestId}] Verification response:`, {
        resCode: response.ResCode ?? response.resCode,
        success: (response.ResCode ?? response.resCode) === 0,
      });

      const resCode = response.ResCode ?? response.resCode;

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
  async settleTransaction(
    params: MellatVerifyParams
  ): Promise<PaymentResponse> {
    const requestId = this.generateRequestId("SETTLE");

    try {
      const mellat = this.createMellatClient();

      strapi.log.info(`[${requestId}] Starting transaction settlement:`, {
        orderId: params.orderId,
        saleOrderId: params.saleOrderId,
        saleReferenceId: params.saleReferenceId,
      });

      const settleRequest = {
        orderId: normalizeNumericParam(params.orderId),
        saleOrderId: normalizeNumericParam(params.saleOrderId),
        saleReferenceId: normalizeNumericParam(params.saleReferenceId),
      };

      const response = await mellat.settlePayment(settleRequest);

      strapi.log.info(`[${requestId}] Settlement response:`, {
        resCode: response.ResCode ?? response.resCode,
        success: (response.ResCode ?? response.resCode) === 0 || (response.ResCode ?? response.resCode) === 45,
      });

      const resCode = response.ResCode ?? response.resCode;

      if (resCode === 0) {
        return {
          success: true,
          message: "Transaction settled successfully",
          resCode,
          requestId,
        };
      } else if (resCode === 45) {
        if (params.allowResCode45Success) {
          return {
            success: true,
            message: "Transaction already settled",
            resCode,
            requestId,
          };
        }
        this.logMellatErrorCode(requestId, resCode);
        return {
          success: false,
          error: `Settlement failed with code: ${resCode}`,
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
  async reverseTransaction(
    params: MellatVerifyParams
  ): Promise<PaymentResponse> {
    const requestId = this.generateRequestId("REVERSE");

    try {
      const mellat = this.createMellatClient();

      strapi.log.info(`[${requestId}] Starting transaction reversal:`, {
        orderId: params.orderId,
        saleOrderId: params.saleOrderId,
        saleReferenceId: params.saleReferenceId,
      });

      const reverseRequest = {
        orderId: normalizeNumericParam(params.orderId),
        saleOrderId: normalizeNumericParam(params.saleOrderId),
        saleReferenceId: normalizeNumericParam(params.saleReferenceId),
      };

      const response = await mellat.reversePayment(reverseRequest);

      strapi.log.info(`[${requestId}] Reversal response:`, {
        resCode: response.ResCode ?? response.resCode,
        success: (response.ResCode ?? response.resCode) === 0,
      });

      const resCode = response.ResCode ?? response.resCode;

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
  async inquiryTransaction(
    params: MellatVerifyParams
  ): Promise<PaymentResponse> {
    const requestId = this.generateRequestId("INQUIRY");

    try {
      const mellat = this.createMellatClient();

      strapi.log.info(`[${requestId}] Starting transaction inquiry:`, {
        orderId: params.orderId,
        saleOrderId: params.saleOrderId,
        saleReferenceId: params.saleReferenceId,
      });

      const inquiryRequest = {
        orderId: normalizeNumericParam(params.orderId),
        saleOrderId: normalizeNumericParam(params.saleOrderId),
        saleReferenceId: normalizeNumericParam(params.saleReferenceId),
      };

      const response = await mellat.inquiryRequest(inquiryRequest);

      strapi.log.info(`[${requestId}] Inquiry response:`, {
        resCode: response.resCode,
      });

      // For inquiry, we just return the status
      return {
        success: true,
        message: `Payment status: ${response.resCode}`,
        resCode: response.resCode,
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
  },
});
