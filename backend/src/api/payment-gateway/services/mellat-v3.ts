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
}

interface MellatVerifyParams {
  orderId: string;
  saleOrderId: string;
  saleReferenceId: string;
}

interface PaymentResponse {
  success: boolean;
  refId?: string;
  redirectUrl?: string;
  error?: string;
  requestId?: string;
  resCode?: number;
  message?: string;
}

export default ({ strapi }: { strapi: Strapi }) => ({
  /**
   * Get Mellat configuration and create client instance
   */
  createMellatClient() {
    const config = {
      terminalId: process.env.MELLAT_TERMINAL_ID || "MELLAT_TERMINAL_ID",
      username: process.env.MELLAT_USERNAME || "MELLAT_TERMINAL_ID",
      password: process.env.MELLAT_PASSWORD || "MELLAT_PASSWORD",
      timeout: 15000, // 15 seconds timeout
      apiUrl:
        process.env.MELLAT_GATEWAY_URL ||
        "https://bpm.shaparak.ir/pgwchannel/services/pgw?wsdl",
    };

    return new MellatCheckout(config);
  },

  /**
   * Format callback URL to be absolute
   */
  formatCallbackUrl(callbackURL?: string): string {
    // Hardcoded production callback URL for Mellat
    const productionCallback =
      "https://infinity.rgbgroup.ir/api/orders/payment-callback";

    // If a custom callback is provided and it's absolute, use it
    if (callbackURL && callbackURL.startsWith("http")) {
      return callbackURL;
    }

    // Otherwise, always use the hardcoded production callback
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
   * Request payment from Mellat gateway
   */
  async requestPayment(params: MellatPaymentParams): Promise<PaymentResponse> {
    const requestId = this.generateRequestId();

    try {
      const mellat = this.createMellatClient();
      const callbackUrl = this.formatCallbackUrl(params.callbackURL);

      strapi.log.info(`[${requestId}] Starting Mellat payment request:`, {
        orderId: params.orderId,
        amount: params.amount,
        userId: params.userId,
        callbackUrl,
        contractId: params.contractId,
      });

      // Initialize the client (optional but recommended)
      await mellat.initialize();

      // Request payment using mellat-checkout package
      const paymentRequest = {
        amount: params.amount,
        orderId: params.orderId.toString(),
        callbackUrl: callbackUrl,
        payerId: params.userId.toString(),
      };

      strapi.log.debug(
        `[${requestId}] Payment request payload:`,
        paymentRequest
      );

      const response = await mellat.paymentRequest(paymentRequest);

      strapi.log.info(`[${requestId}] Mellat payment response:`, {
        resCode: response.resCode,
        refId: response.refId,
        success: response.resCode === 0,
      });

      if (response.resCode === 0) {
        // Success - create redirect URL with RefId parameter
        const redirectUrl = `https://bpm.shaparak.ir/pgwchannel/startpay.mellat`;

        strapi.log.info(`[${requestId}] Payment request successful:`, {
          refId: response.refId,
          redirectUrl,
          resCode: response.resCode,
        });

        return {
          success: true,
          refId: response.refId,
          redirectUrl, // The mellat-checkout package handles the RefId internally
          requestId,
          resCode: response.resCode,
          message: "Payment request successful",
        };
      } else {
        // Error - log the error code
        this.logMellatErrorCode(requestId, response.resCode);

        return {
          success: false,
          error: `Gateway error: ${response.resCode}`,
          requestId,
          resCode: response.resCode,
        };
      }
    } catch (error) {
      strapi.log.error(`[${requestId}] Error in Mellat payment request:`, {
        message: error.message,
        stack: error.stack,
        error: error,
      });

      return {
        success: false,
        error: error.message || "Payment request failed",
        requestId,
      };
    }
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
        orderId: params.orderId,
        saleOrderId: params.saleOrderId,
        saleReferenceId: params.saleReferenceId,
      };

      const response = await mellat.verifyPayment(verifyRequest);

      strapi.log.info(`[${requestId}] Verification response:`, {
        resCode: response.resCode,
        success: response.resCode === 0,
      });

      if (response.resCode === 0) {
        return {
          success: true,
          message: "Transaction verified successfully",
          resCode: response.resCode,
          requestId,
        };
      } else {
        this.logMellatErrorCode(requestId, response.resCode);

        return {
          success: false,
          error: `Verification failed with code: ${response.resCode}`,
          resCode: response.resCode,
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
        orderId: params.orderId,
        saleOrderId: params.saleOrderId,
        saleReferenceId: params.saleReferenceId,
      };

      const response = await mellat.settlePayment(settleRequest);

      strapi.log.info(`[${requestId}] Settlement response:`, {
        resCode: response.resCode,
        success: response.resCode === 0 || response.resCode === 45,
      });

      if (response.resCode === 0) {
        return {
          success: true,
          message: "Transaction settled successfully",
          resCode: response.resCode,
          requestId,
        };
      } else if (response.resCode === 45) {
        return {
          success: true,
          message: "Transaction already settled",
          resCode: response.resCode,
          requestId,
        };
      } else {
        this.logMellatErrorCode(requestId, response.resCode);

        return {
          success: false,
          error: `Settlement failed with code: ${response.resCode}`,
          resCode: response.resCode,
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
        orderId: params.orderId,
        saleOrderId: params.saleOrderId,
        saleReferenceId: params.saleReferenceId,
      };

      const response = await mellat.reversalRequest(reverseRequest);

      strapi.log.info(`[${requestId}] Reversal response:`, {
        resCode: response.resCode,
        success: response.resCode === 0,
      });

      if (response.resCode === 0) {
        return {
          success: true,
          message: "Transaction reversed successfully",
          resCode: response.resCode,
          requestId,
        };
      } else {
        this.logMellatErrorCode(requestId, response.resCode);

        return {
          success: false,
          error: `Reversal failed with code: ${response.resCode}`,
          resCode: response.resCode,
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
        orderId: params.orderId,
        saleOrderId: params.saleOrderId,
        saleReferenceId: params.saleReferenceId,
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
