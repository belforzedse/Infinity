/**
 * SnappPay Installment Payment Gateway Service
 */

import axios, { AxiosInstance } from "axios";
import { Strapi } from "@strapi/strapi";

type SnappPayAccessTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
  scope: string;
  iat?: number;
  jti?: string;
};

type SnappPayEligibleResponse = {
  successful: boolean;
  response?: {
    eligible: boolean;
    title_message?: string;
    description?: string;
  };
  errorData?: { errorCode: number; message: string; data?: unknown };
};

type SnappPayTokenRequest = {
  amount: number; // IRR
  discountAmount: number; // IRR
  externalSourceAmount: number; // IRR
  mobile: string; // 98XXXXXXXXXX
  paymentMethodTypeDto: "INSTALLMENT";
  returnURL: string; // absolute URL, POST callback
  transactionId: string; // merchant-generated unique id (5-10 chars; include a letter if >10)
  cartList: Array<{
    cartId: number;
    cartItems: Array<{
      amount: number; // IRR per item
      category: string;
      count: number;
      id: number;
      name: string;
      commissionType: number; // 1,2,3,...
    }>;
    isShipmentIncluded: boolean;
    isTaxIncluded: boolean;
    shippingAmount: number; // IRR
    taxAmount: number; // IRR
    totalAmount: number; // IRR
  }>;
};

type SnappPayTokenResponse = {
  successful: boolean;
  response?: { paymentToken: string; paymentPageUrl: string };
  errorData?: { errorCode: number; message: string; data?: unknown };
};

type SnappPaySimpleResponse = {
  successful: boolean;
  response?: { transactionId?: string; status?: string };
  errorData?: { errorCode: number; message: string; data?: unknown };
};

let cachedToken: { token: string; expiresAt: number } | null = null;

function getSnappConfig() {
  return {
    baseUrl:
      process.env.SNAPPAY_BASE_URL ||
      "https://fms-gateway-staging.apps.public.okd4.teh-1.snappcloud.io",
    clientId: process.env.SNAPPAY_CLIENT_ID || "infinity",
    clientSecret: process.env.SNAPPAY_CLIENT_SECRET || "m7Z*e6RJp#DaWZQc",
    username: process.env.SNAPPAY_USERNAME || "infinity-purchase",
    password: process.env.SNAPPAY_PASSWORD || "J#FFlaz3*#eSpy5N",
  };
}

async function fetchAccessToken(http: AxiosInstance): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 10_000) {
    return cachedToken.token;
  }

  const { clientId, clientSecret, username, password } = getSnappConfig();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const body = new URLSearchParams();
  body.append("grant_type", "password");
  body.append("scope", "online-merchant");
  body.append("username", username);
  body.append("password", password);

  const { data } = await http.post<SnappPayAccessTokenResponse>(
    "/api/online/v1/oauth/token",
    body.toString(),
    {
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 20_000,
    }
  );

  const expiresAt = Date.now() + (data.expires_in - 30) * 1000; // small safety margin
  cachedToken = { token: data.access_token, expiresAt };
  return data.access_token;
}

function createHttp(): AxiosInstance {
  const { baseUrl } = getSnappConfig();
  return axios.create({ baseURL: baseUrl });
}

export default ({ strapi }: { strapi: Strapi }) => ({
  /** Check eligibility for amount (IRR) */
  async eligible(amountIRR: number) {
    const http = createHttp();
    try {
      const token = await fetchAccessToken(http);
      const { data } = await http.get<SnappPayEligibleResponse>(
        `/api/online/offer/v1/eligible`,
        {
          params: { amount: amountIRR },
          headers: { Authorization: `Bearer ${token}` },
          timeout: 20_000,
        }
      );
      return data;
    } catch (error: any) {
      strapi.log.error("SnappPay eligible error", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return {
        successful: false,
        errorData: {
          errorCode: error.response?.status || 500,
          message: error.message,
          data: error.response?.data,
        },
      } as SnappPayEligibleResponse;
    }
  },

  /** Request payment token and page URL */
  async requestPaymentToken(payload: SnappPayTokenRequest) {
    const http = createHttp();
    try {
      const token = await fetchAccessToken(http);
      // Keep '+' in mobile; API error 1005 indicates pattern "+98\\d{10}"
      const normalizedPayload = {
        ...payload,
        mobile: String(payload.mobile || ""),
      } as SnappPayTokenRequest;

      // Guard: if helper passed without '+', normalize to +98XXXXXXXXXX
      if (!/^\+98\d{10}$/.test(normalizedPayload.mobile)) {
        const digits = String(normalizedPayload.mobile).replace(/\D/g, "");
        let m = digits;
        if (m.startsWith("0")) m = `98${m.slice(1)}`;
        if (!m.startsWith("98") && m.length === 10) m = `98${m}`;
        normalizedPayload.mobile = m ? `+${m}` : "";
      }

      try {
        strapi.log.info("SnappPay token request", {
          amount: normalizedPayload.amount,
          hasPlus: normalizedPayload.mobile.startsWith("+"),
          mobilePatternOk: /^\+98\d{10}$/.test(normalizedPayload.mobile),
          returnURL: normalizedPayload.returnURL,
          transactionId: normalizedPayload.transactionId,
          cartTotal: normalizedPayload.cartList?.[0]?.totalAmount,
        });
      } catch {}

      const { data } = await http.post<SnappPayTokenResponse>(
        "/api/online/payment/v1/token",
        normalizedPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 25_000,
        }
      );
      try {
        strapi.log.info("SnappPay token response", {
          successful: data?.successful,
          hasPaymentToken: !!data?.response?.paymentToken,
          hasPaymentPageUrl: !!data?.response?.paymentPageUrl,
          errorCode: data?.errorData?.errorCode,
          errorMessage: data?.errorData?.message,
        });
      } catch {}
      return data;
    } catch (error: any) {
      strapi.log.error("SnappPay token error", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return {
        successful: false,
        errorData: {
          errorCode: error.response?.status || 500,
          message: error.message,
          data: error.response?.data,
        },
      } as SnappPayTokenResponse;
    }
  },

  /** Verify purchase (requires paymentToken) */
  async verify(paymentToken: string) {
    const http = createHttp();
    try {
      const token = await fetchAccessToken(http);
      const { data } = await http.post<SnappPaySimpleResponse>(
        "/api/online/payment/v1/verify",
        { paymentToken },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 20_000 }
      );
      return data;
    } catch (error: any) {
      strapi.log.error("SnappPay verify error", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return {
        successful: false,
        errorData: {
          errorCode: error.response?.status || 500,
          message: error.message,
          data: error.response?.data,
        },
      } as SnappPaySimpleResponse;
    }
  },

  /** Settle purchase (requires paymentToken) */
  async settle(paymentToken: string) {
    const http = createHttp();
    try {
      const token = await fetchAccessToken(http);
      const { data } = await http.post<SnappPaySimpleResponse>(
        "/api/online/payment/v1/settle",
        { paymentToken },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 20_000 }
      );
      return data;
    } catch (error: any) {
      strapi.log.error("SnappPay settle error", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return {
        successful: false,
        errorData: {
          errorCode: error.response?.status || 500,
          message: error.message,
          data: error.response?.data,
        },
      } as SnappPaySimpleResponse;
    }
  },

  /** Cancel purchase (after settle) */
  async cancel(paymentToken: string) {
    const http = createHttp();
    try {
      const token = await fetchAccessToken(http);
      const { data } = await http.post<SnappPaySimpleResponse>(
        "/api/online/payment/v1/cancel",
        { paymentToken },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 20_000 }
      );
      return data;
    } catch (error: any) {
      strapi.log.error("SnappPay cancel error", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return {
        successful: false,
        errorData: {
          errorCode: error.response?.status || 500,
          message: error.message,
          data: error.response?.data,
        },
      } as SnappPaySimpleResponse;
    }
  },

  /** Revert purchase (before settle) */
  async revert(paymentToken: string) {
    const http = createHttp();
    try {
      const token = await fetchAccessToken(http);
      const { data } = await http.post<SnappPaySimpleResponse>(
        "/api/online/payment/v1/revert",
        { paymentToken },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 20_000 }
      );
      return data;
    } catch (error: any) {
      strapi.log.error("SnappPay revert error", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return {
        successful: false,
        errorData: {
          errorCode: error.response?.status || 500,
          message: error.message,
          data: error.response?.data,
        },
      } as SnappPaySimpleResponse;
    }
  },

  /** Inquiry status */
  async status(paymentToken: string) {
    const http = createHttp();
    try {
      const token = await fetchAccessToken(http);
      const { data } = await http.get<SnappPaySimpleResponse>(
        "/api/online/payment/v1/status",
        {
          params: { paymentToken },
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15_000,
        }
      );
      return data;
    } catch (error: any) {
      strapi.log.error("SnappPay status error", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return {
        successful: false,
        errorData: {
          errorCode: error.response?.status || 500,
          message: error.message,
          data: error.response?.data,
        },
      } as SnappPaySimpleResponse;
    }
  },

  /** Update order (partial refund) */
  async update(payload: {
    transactionId: string;
    amount: number; // IRR, new total
    discountAmount: number; // IRR
    externalSourceAmount: number; // IRR
    cartList: Array<{
      cartId: number;
      cartItems: Array<{
        amount: number;
        category: string;
        count: number;
        id: number;
        name: string;
        commissionType: number;
      }>;
      isShipmentIncluded: boolean;
      isTaxIncluded: boolean;
      shippingAmount: number;
      taxAmount: number;
      totalAmount: number;
    }>;
  }) {
    const http = createHttp();
    try {
      const token = await fetchAccessToken(http);
      strapi.log.info("SnappPay update request", {
        transactionId: payload.transactionId,
        amount: payload.amount,
        cartTotal: payload.cartList?.[0]?.totalAmount,
      });
      const { data } = await http.post<SnappPaySimpleResponse>(
        "/api/online/payment/v1/updateOrder",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 25_000,
        }
      );
      strapi.log.info("SnappPay update response", {
        successful: data?.successful,
        errorCode: data?.errorData?.errorCode,
        errorMessage: data?.errorData?.message,
      });
      return data;
    } catch (error: any) {
      strapi.log.error("SnappPay update error", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return {
        successful: false,
        errorData: {
          errorCode: error.response?.status || 500,
          message: error.message,
          data: error.response?.data,
        },
      } as SnappPaySimpleResponse;
    }
  },

  /** Cancel order (full refund) */
  async cancelOrder(transactionId: string) {
    const http = createHttp();
    try {
      const token = await fetchAccessToken(http);
      strapi.log.info("SnappPay cancelOrder request", { transactionId });
      const { data } = await http.post<SnappPaySimpleResponse>(
        "/api/online/payment/v1/cancelOrder",
        { transactionId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 25_000,
        }
      );
      strapi.log.info("SnappPay cancelOrder response", {
        successful: data?.successful,
        errorCode: data?.errorData?.errorCode,
        errorMessage: data?.errorData?.message,
      });
      return data;
    } catch (error: any) {
      strapi.log.error("SnappPay cancelOrder error", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return {
        successful: false,
        errorData: {
          errorCode: error.response?.status || 500,
          message: error.message,
          data: error.response?.data,
        },
      } as SnappPaySimpleResponse;
    }
  },
});
