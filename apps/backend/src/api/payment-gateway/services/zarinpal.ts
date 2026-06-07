/**
 * ZarinPal payment gateway service.
 *
 * Uses the official zarinpal-node-sdk for REST calls, redirect URL generation,
 * and verification. Merchant credentials are read exclusively from env vars.
 */

import ZarinPal from "zarinpal-node-sdk";
import { Strapi } from "@strapi/strapi";

type ZarinPalCurrency = "IRR" | "IRT";

type ZarinPalConfig = {
  merchantId: string;
  sandbox: boolean;
  callbackUrl: string;
  currency: ZarinPalCurrency;
};

type ZarinPalRequestParams = {
  orderId: number;
  amountToman: number;
  contractId?: number;
  mobile?: string;
  email?: string;
  description?: string;
};

type ZarinPalVerifyParams = {
  authority: string;
  amountToman: number;
};

const REQUEST_ENDPOINT = "/pg/v4/payment/request.json";

const isTruthyEnv = (value?: string): boolean =>
  ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());

const normalizeCurrency = (value?: string): ZarinPalCurrency => {
  const normalized = String(value || "IRR").trim().toUpperCase();
  return normalized === "IRT" ? "IRT" : "IRR";
};

const normalizeMobile = (raw?: string): string | undefined => {
  if (!raw) return undefined;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("0098") && digits.length === 14) return `0${digits.slice(4)}`;
  if (digits.startsWith("98") && digits.length === 12) return `0${digits.slice(2)}`;
  if (digits.startsWith("0") && digits.length === 11) return digits;
  if (digits.length === 10) return `0${digits}`;
  return undefined;
};

const sanitizeGatewayResponse = (value: unknown) => {
  if (!value || typeof value !== "object") return value;
  const clone = JSON.parse(JSON.stringify(value));
  if (clone?.merchant_id) delete clone.merchant_id;
  return clone;
};

const parseGatewayError = (error: any) => ({
  message: error?.message || "ZarinPal gateway request failed",
  status: error?.response?.status,
  data: sanitizeGatewayResponse(error?.response?.data),
});

export default ({ strapi }: { strapi: Strapi }) => ({
  getConfig(): ZarinPalConfig {
    const merchantId = String(process.env.ZARINPAL_MERCHANT_ID || "").trim();
    if (!merchantId) {
      throw new Error("ZarinPal merchant ID is not configured");
    }

    const baseUrl = (process.env.URL || "").trim().replace(/\/$/, "");
    const callbackUrl = String(
      process.env.ZARINPAL_CALLBACK_URL ||
        (baseUrl ? `${baseUrl}/api/orders/payment-callback` : ""),
    ).trim();

    if (!/^https?:\/\//i.test(callbackUrl)) {
      throw new Error("ZarinPal callback URL is not configured");
    }

    return {
      merchantId,
      sandbox: isTruthyEnv(process.env.ZARINPAL_SANDBOX),
      callbackUrl,
      currency: normalizeCurrency(process.env.ZARINPAL_CURRENCY),
    };
  },

  createClient(config?: ZarinPalConfig) {
    const resolved = config || this.getConfig();
    return new ZarinPal({
      merchantId: resolved.merchantId,
      sandbox: resolved.sandbox,
    });
  },

  amountForGateway(amountToman: number, currency?: ZarinPalCurrency): number {
    const resolvedCurrency = currency || this.getConfig().currency;
    const normalizedToman = Math.max(0, Math.round(Number(amountToman || 0)));
    return resolvedCurrency === "IRR" ? normalizedToman * 10 : normalizedToman;
  },

  assertValidAmount(amount: number, currency: ZarinPalCurrency) {
    const minimum = currency === "IRR" ? 10_000 : 1_000;
    if (!Number.isFinite(amount) || amount < minimum) {
      throw new Error(`ZarinPal amount must be at least ${minimum} ${currency}`);
    }
  },

  async requestPayment(params: ZarinPalRequestParams) {
    const requestId = `ZP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const config = this.getConfig();
    const client = this.createClient(config);
    const amount = this.amountForGateway(params.amountToman, config.currency);
    this.assertValidAmount(amount, config.currency);

    const mobile = normalizeMobile(params.mobile);
    const description =
      params.description || `Payment for Infinity order #${params.orderId}`;
    const payload: Record<string, unknown> = {
      amount,
      currency: config.currency,
      callback_url: config.callbackUrl,
      description: description.slice(0, 500),
      metadata: {
        order_id: String(params.orderId),
        ...(mobile ? { mobile } : {}),
        ...(params.email ? { email: params.email } : {}),
      },
    };

    try {
      strapi.log.info(`[${requestId}] Initiating ZarinPal payment`, {
        orderId: params.orderId,
        contractId: params.contractId,
        amount,
        currency: config.currency,
        sandbox: config.sandbox,
        callbackUrl: config.callbackUrl,
      });

      const response = await client.request("POST", REQUEST_ENDPOINT, payload);
      const code = Number(response?.data?.code ?? response?.code);
      const authority = response?.data?.authority || response?.authority;

      if (code === 100 && authority) {
        return {
          success: true,
          authority: String(authority),
          refId: String(authority),
          redirectUrl: client.payments.getRedirectUrl(String(authority)),
          requestId,
          amount,
          currency: config.currency,
          gatewayResponse: sanitizeGatewayResponse(response),
        };
      }

      return {
        success: false,
        requestId,
        amount,
        currency: config.currency,
        error:
          response?.data?.message ||
          response?.errors?.message ||
          `ZarinPal request failed with code ${code}`,
        code,
        detailedError: sanitizeGatewayResponse(response),
      };
    } catch (error: any) {
      const details = parseGatewayError(error);
      strapi.log.error(`[${requestId}] ZarinPal payment request error`, details);
      return {
        success: false,
        requestId,
        amount,
        currency: config.currency,
        error: details.message,
        detailedError: details,
      };
    }
  },

  async verifyPayment(params: ZarinPalVerifyParams) {
    const requestId = `ZPVERIFY-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const config = this.getConfig();
    const client = this.createClient(config);
    const amount = this.amountForGateway(params.amountToman, config.currency);
    this.assertValidAmount(amount, config.currency);

    try {
      strapi.log.info(`[${requestId}] Verifying ZarinPal payment`, {
        authority: params.authority,
        amount,
        currency: config.currency,
        sandbox: config.sandbox,
      });

      const response = await client.verifications.verify({
        amount,
        authority: params.authority,
      });
      const data = response?.data || {};
      const code = Number(data?.code ?? response?.code);

      return {
        success: code === 100 || code === 101,
        alreadyVerified: code === 101,
        code,
        message: data?.message || response?.message,
        refId: data?.ref_id != null ? String(data.ref_id) : undefined,
        cardPan: data?.card_pan,
        cardHash: data?.card_hash,
        fee: data?.fee,
        feeType: data?.fee_type,
        requestId,
        amount,
        currency: config.currency,
        gatewayResponse: sanitizeGatewayResponse(response),
      };
    } catch (error: any) {
      const details = parseGatewayError(error);
      strapi.log.error(`[${requestId}] ZarinPal verification error`, details);
      return {
        success: false,
        code: Number(error?.response?.data?.data?.code ?? -999),
        requestId,
        amount,
        currency: config.currency,
        error: details.message,
        gatewayResponse: details.data,
      };
    }
  },
});
