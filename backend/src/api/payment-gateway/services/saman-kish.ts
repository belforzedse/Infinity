/**
 * Saman Kish (SEP) payment gateway service
 *
 * Handles token issuance, transaction verification, and reversal flows.
 */

import axios, { AxiosError } from "axios";
import crypto from "node:crypto";
import { Strapi } from "@strapi/strapi";

type SamanTokenRequest = {
  orderId: number;
  amount: number; // IRR
  callbackURL?: string;
  contractId?: number;
  resNum?: string;
  cellNumber?: string;
  wage?: number;
  affectiveAmount?: number;
  tokenExpiryInMin?: number;
};

type SamanTokenResponse = {
  success: boolean;
  token?: string;
  redirectUrl?: string;
  resNum?: string;
  requestId: string;
  status?: number;
  errorCode?: string | number;
  error?: string;
  detailedError?: unknown;
};

type SamanVerifyParams = {
  refNum: string;
  terminalNumber?: number;
};

type SamanVerifyResponse = {
  success: boolean;
  resultCode: number;
  resultDescription: string;
  transactionDetail?: any;
  requestId: string;
  error?: string;
  detailedError?: unknown;
};

type SamanConfig = {
  gatewayUrl: string;
  paymentPageUrl: string;
  sendTokenUrl: string;
  verifyUrl: string;
  reverseUrl: string;
  terminalId?: string;
  username?: string;
  password?: string;
  callbackUrl: string;
  tokenExpiryInMin?: number;
};

const STATE_MESSAGES: Record<string, string> = {
  OK: "پرداخت با موفقیت انجام شد",
  CANCELEDBYUSER: "کاربر از ادامه تراکنش منصرف شد",
  FAILED: "پرداخت انجام نشد",
  SESSIONISNULL: "کاربر در بازه زمانی تعیین شده پاسخی ارسال نکرده است",
  INVALIDPARAMETERS: "پارامترهای ارسالی نامعتبر است",
  TOKENNOTFOUND: "توکن ارسال شده یافت نشد",
  TERMINALNOTFOUND: "شماره ترمینال ارسال شده یافت نشد",
};

const RESULT_CODE_MESSAGES: Record<number, string> = {
  [-2]: "تراکنش یافت نشد",
  [-6]: "مهلت تایید تراکنش منقضی شده است",
  [0]: "عملیات با موفقیت انجام شد",
  [2]: "درخواست تکراری است",
  [-104]: "ترمینال غیرفعال است",
  [-105]: "ترمینال یافت نشد",
  [-106]: "آی‌پی مجاز نیست",
  [5]: "تراکنش قبلاً برگشت خورده است",
};

function parseAxiosError(error: AxiosError) {
  return {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
  };
}

function normalizeCellNumber(input?: string): string | undefined {
  if (!input) return undefined;
  const digits = input.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("98") && digits.length === 12) return `0${digits.slice(2)}`;
  if (digits.startsWith("0098") && digits.length === 14) return `0${digits.slice(4)}`;
  if (digits.startsWith("0") && digits.length === 11) return digits;
  if (digits.length === 10) return `0${digits}`;
  return undefined;
}

export default ({ strapi }: { strapi: Strapi }) => ({
  getConfig(): SamanConfig {
    return {
      gatewayUrl:
        process.env.SAMAN_GATEWAY_URL || "https://sep.shaparak.ir/onlinepg/onlinepg",
      paymentPageUrl:
        process.env.SAMAN_PAYMENT_PAGE_URL || "https://sep.shaparak.ir/OnlinePG/OnlinePG",
      sendTokenUrl:
        process.env.SAMAN_SEND_TOKEN_URL || "https://sep.shaparak.ir/OnlinePG/SendToken",
      verifyUrl:
        process.env.SAMAN_VERIFY_URL ||
        "https://sep.shaparak.ir/verifyTxnRandomSessionkey/ipg/VerifyTransaction",
      reverseUrl:
        process.env.SAMAN_REVERSE_URL ||
        "https://sep.shaparak.ir/verifyTxnRandomSessionkey/ipg/ReverseTransaction",
      terminalId: process.env.SAMAN_TERMINAL_ID,
      username: process.env.SAMAN_USERNAME,
      password: process.env.SAMAN_PASSWORD,
      callbackUrl:
        process.env.SAMAN_CALLBACK_URL ||
        `${(process.env.URL || "https://api.new.infinitycolor.co/").replace(/\/$/, "")}/api/orders/payment-callback`,
      tokenExpiryInMin:
        process.env.SAMAN_TOKEN_EXPIRY_MIN !== undefined
          ? Number(process.env.SAMAN_TOKEN_EXPIRY_MIN)
          : 20,
    };
  },

  generateRequestId(prefix: string = "SAMAN"): string {
    return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  },

  generateResNum(orderId: number): string {
    const randomSegment = crypto.randomBytes(4).toString("hex");
    return `${orderId}-${Date.now()}-${randomSegment}`;
  },

  formatCallbackUrl(custom?: string): string {
    if (custom && /^https?:\/\//i.test(custom)) {
      return custom;
    }
    return this.getConfig().callbackUrl;
  },

  buildRedirectUrl(token: string): string {
    const { sendTokenUrl, paymentPageUrl } = this.getConfig();
    if (sendTokenUrl) {
      return `${sendTokenUrl}?token=${encodeURIComponent(token)}`;
    }
    return paymentPageUrl;
  },

  async requestPayment(params: SamanTokenRequest): Promise<SamanTokenResponse> {
    const requestId = this.generateRequestId();
    const config = this.getConfig();

    if (!config.terminalId) {
      return {
        success: false,
        error: "Saman terminal ID is not configured",
        requestId,
      };
    }

    const resNum = params.resNum || this.generateResNum(params.orderId);
    const payload: Record<string, unknown> = {
      Action: "Token",
      TerminalId: config.terminalId,
      Amount: Math.max(0, Math.round(params.amount)),
      ResNum: resNum,
      RedirectUrl: this.formatCallbackUrl(params.callbackURL),
    };

    const tokenExpiry =
      params.tokenExpiryInMin ?? config.tokenExpiryInMin ?? undefined;
    if (tokenExpiry && Number.isFinite(tokenExpiry)) {
      payload.TokenExpiryInMin = Math.max(1, Number(tokenExpiry));
    }

    if (params.wage !== undefined) {
      payload.Wage = Math.round(params.wage);
    }

    if (params.affectiveAmount !== undefined) {
      payload.AffectiveAmount = Math.round(params.affectiveAmount);
    }

    const normalizedCell = normalizeCellNumber(params.cellNumber);
    if (normalizedCell) {
      payload.CellNumber = normalizedCell;
    }

    try {
      strapi.log.info(`[${requestId}] Initiating Saman token request`, {
        orderId: params.orderId,
        contractId: params.contractId,
        amount: payload.Amount,
        redirectUrl: payload.RedirectUrl,
      });

      const { data } = await axios.post(
        config.gatewayUrl,
        payload,
        {
          headers: { "Content-Type": "application/json" },
          timeout: 20_000,
        }
      );

      strapi.log.info(`[${requestId}] Saman token response`, {
        status: data?.status,
        errorCode: data?.errorCode,
      });

      if (data?.status === 1 && data?.token) {
        return {
          success: true,
          token: data.token,
          redirectUrl: this.buildRedirectUrl(data.token),
          resNum,
          requestId,
          status: data.status,
        };
      }

      return {
        success: false,
        error: data?.errorDesc || "Token request failed",
        errorCode: data?.errorCode,
        status: data?.status,
        requestId,
        detailedError: data,
      };
    } catch (err: any) {
      const details = err.isAxiosError ? parseAxiosError(err) : { message: err?.message };
      strapi.log.error(`[${requestId}] Saman token request error`, details);
      return {
        success: false,
        error: details.message || "Token request failed",
        requestId,
        detailedError: details,
      };
    }
  },

  async verifyTransaction(params: SamanVerifyParams): Promise<SamanVerifyResponse> {
    const requestId = this.generateRequestId("VERIFY");
    const config = this.getConfig();
    const terminalNumber = params.terminalNumber ?? Number(config.terminalId);

    try {
      strapi.log.info(`[${requestId}] Verifying Saman transaction`, {
        refNum: params.refNum,
        terminalNumber,
      });

      const { data } = await axios.post(
        config.verifyUrl,
        {
          RefNum: params.refNum,
          TerminalNumber: terminalNumber,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 20_000,
        }
      );

      const resultCode = Number(data?.ResultCode ?? data?.resultCode ?? -999);
      const description =
        data?.ResultDescription ||
        data?.resultDescription ||
        RESULT_CODE_MESSAGES[resultCode] ||
        "نامشخص";
      const success = Boolean(data?.Success);

      strapi.log.info(`[${requestId}] Saman verify response`, {
        success,
        resultCode,
        description,
      });

      return {
        success,
        resultCode,
        resultDescription: description,
        transactionDetail: data?.TransactionDetail ?? data?.transactionDetail,
        requestId,
        detailedError: data,
      };
    } catch (err: any) {
      const details = err.isAxiosError ? parseAxiosError(err) : { message: err?.message };
      strapi.log.error(`[${requestId}] Saman verify error`, details);
      return {
        success: false,
        resultCode: -999,
        resultDescription: details.message || "Verification failed",
        requestId,
        error: details.message,
        detailedError: details,
      };
    }
  },

  async reverseTransaction(params: SamanVerifyParams): Promise<SamanVerifyResponse> {
    const requestId = this.generateRequestId("REVERSE");
    const config = this.getConfig();
    const terminalNumber = params.terminalNumber ?? Number(config.terminalId);

    try {
      strapi.log.info(`[${requestId}] Reversing Saman transaction`, {
        refNum: params.refNum,
        terminalNumber,
      });

      const { data } = await axios.post(
        config.reverseUrl,
        {
          RefNum: params.refNum,
          TerminalNumber: terminalNumber,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 20_000,
        }
      );

      const resultCode = Number(data?.ResultCode ?? data?.resultCode ?? -999);
      const description =
        data?.ResultDescription ||
        data?.resultDescription ||
        RESULT_CODE_MESSAGES[resultCode] ||
        "نامشخص";

      strapi.log.info(`[${requestId}] Saman reverse response`, {
        resultCode,
        description,
      });

      return {
        success: Boolean(data?.Success),
        resultCode,
        resultDescription: description,
        transactionDetail: data?.TransactionDetail ?? data?.transactionDetail,
        requestId,
        detailedError: data,
      };
    } catch (err: any) {
      const details = err.isAxiosError ? parseAxiosError(err) : { message: err?.message };
      strapi.log.error(`[${requestId}] Saman reverse error`, details);
      return {
        success: false,
        resultCode: -999,
        resultDescription: details.message || "Reversal failed",
        requestId,
        error: details.message,
        detailedError: details,
      };
    }
  },

  describeState(state?: string): string | undefined {
    if (!state) return undefined;
    const normalized = state.replace(/\s+/g, "").toUpperCase();
    return STATE_MESSAGES[normalized];
  },

  describeResultCode(code?: number): string | undefined {
    if (code === undefined || Number.isNaN(code)) return undefined;
    return RESULT_CODE_MESSAGES[code];
  },
});
