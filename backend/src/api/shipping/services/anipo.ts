import axios, { AxiosInstance } from "axios";
import type { Strapi } from "@strapi/strapi";

type BarcodePriceRequest = {
  keyword: string;
  orderData: {
    city: number; // city code (int)
    weight: number; // grams
    sum: number; // IRR
    isnonstandard: 0 | 1;
    smsservice: 0 | 1;
    PayTypeID?: number; // optional byte flag required by upstream (workaround)
  };
};

type BarcodePriceResponse = {
  status: boolean;
  data?: number;
  message?: string;
};

type GetBarcodeRequest = {
  keyword: string;
  ordersData: {
    orderId: number;
    date?: string;
    time?: string;
    province_code: string;
    province_name: string;
    city_name: string;
    name: string;
    postcode?: string;
    national_code?: string;
    call_number?: string;
    address: string;
    weight: number; // grams
    boxSizeId?: number; // 1..10
    isnonstandard: 0 | 1;
    sum: number; // IRR
  };
};

type GetBarcodeResponse = {
  status: boolean;
  data?: {
    postprice: number;
    tax: number;
    barcode: string;
    boxSizeId?: number;
  };
  message?: string;
};

function getConfig() {
  const base = process.env.ANIPO_BASE_URL || "https://panel.anipo.ir";
  const keyword = process.env.ANIPO_KEYWORD || "";
  return { baseUrl: base, keyword };
}

function http(): AxiosInstance {
  const { baseUrl } = getConfig();
  return axios.create({ baseURL: baseUrl, timeout: 15000 });
}

function maskKeyword<T extends { keyword?: string }>(obj: T): T | any {
  if (!obj) return obj;
  const clone: any = JSON.parse(JSON.stringify(obj));
  if (clone.keyword) clone.keyword = "***";
  return clone;
}

function toJson(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

export default ({ strapi }: { strapi: Strapi }) => ({
  async barcodePrice(params: {
    cityCode: number;
    weight: number;
    sum: number;
    isnonstandard?: 0 | 1;
    smsservice?: 0 | 1;
  }): Promise<{ ok: boolean; price?: number; error?: string }> {
    const { keyword } = getConfig();
    if (!keyword) return { ok: false, error: "missing_keyword" };
    const body: BarcodePriceRequest = {
      keyword,
      orderData: {
        city: params.cityCode,
        weight: Math.max(1, Math.floor(params.weight || 1)),
        sum: Math.max(0, Math.floor(params.sum || 0)),
        isnonstandard: params.isnonstandard ?? 0,
        smsservice: params.smsservice ?? 0,
        PayTypeID: 0,
      },
    };
    try {
      strapi.log.info(
        `[anipo] http request endpoint=/backend/api/barcodePrice/ body=${toJson(
          maskKeyword(body)
        )}`
      );
      const res = await http().post<BarcodePriceResponse>(
        "/backend/api/barcodePrice/",
        body
      );
      strapi.log.info(
        `[anipo] http response endpoint=/backend/api/barcodePrice/ status=${
          res.status
        } body=${toJson(res.data)}`
      );
      if (res.data?.status && typeof res.data.data === "number") {
        return { ok: true, price: res.data.data };
      }
      return { ok: false, error: res.data?.message || "anipo_error" };
    } catch (e: any) {
      const status = e?.response?.status;
      const responseData = e?.response?.data;
      const url = e?.config?.url;
      let reqBody: any = e?.config?.data;
      try {
        reqBody = typeof reqBody === "string" ? JSON.parse(reqBody) : reqBody;
      } catch {}
      strapi.log.error(
        `[anipo] http error endpoint=/backend/api/barcodePrice/ message=${
          e?.message
        } status=${status} url=${url} request=${toJson(
          maskKeyword(reqBody)
        )} response=${toJson(responseData)}`
      );
      return { ok: false, error: "network_error" };
    }
  },

  async getBarcode(input: {
    orderId: number;
    provinceCode: string;
    provinceName: string;
    cityName: string;
    name: string;
    postcode?: string;
    nationalCode?: string;
    callNumber?: string;
    address: string;
    weight: number;
    boxSizeId?: number;
    isnonstandard?: 0 | 1;
    sum: number;
  }): Promise<{
    ok: boolean;
    data?: {
      postprice: number;
      tax: number;
      barcode: string;
      boxSizeId?: number;
    };
    error?: string;
  }> {
    const { keyword } = getConfig();
    if (!keyword) return { ok: false, error: "missing_keyword" };
    // Normalize phone for Anipo: expects max 12 chars, local format 0XXXXXXXXXX
    const normalizePhoneForAnipo = (raw?: string) => {
      const d = String(raw || "").replace(/\D/g, "");
      // Remove leading country code 98 if present
      let n = d;
      if (n.startsWith("98")) n = n.substring(2);
      // Ensure 0-prefixed local number
      if (n && !n.startsWith("0")) n = `0${n}`;
      // Trim to 12 chars just in case (Anipo limit)
      return n.substring(0, 12);
    };

    const body: GetBarcodeRequest = {
      keyword,
      ordersData: {
        orderId: input.orderId,
        date: "",
        time: "",
        province_code: input.provinceCode,
        province_name: input.provinceName,
        city_name: input.cityName,
        name: input.name,
        postcode: input.postcode || "",
        national_code: input.nationalCode || "",
        call_number: normalizePhoneForAnipo(input.callNumber),
        address: input.address,
        weight: Math.max(1, Math.floor(input.weight || 1)),
        boxSizeId: input.boxSizeId,
        isnonstandard: input.isnonstandard ?? 0,
        sum: Math.max(0, Math.floor(input.sum || 0)),
      },
    };
    try {
      strapi.log.info(
        `[anipo] http request endpoint=/backend/api/getBarcode/ body=${toJson(
          maskKeyword(body)
        )}`
      );
      const res = await http().post<GetBarcodeResponse>(
        "/backend/api/getBarcode/",
        body
      );
      strapi.log.info(
        `[anipo] http response endpoint=/backend/api/getBarcode/ status=${
          res.status
        } body=${toJson(res.data)}`
      );
      if (res.data?.status && res.data.data) {
        return { ok: true, data: res.data.data };
      }
      return { ok: false, error: res.data?.message || "anipo_error" };
    } catch (e: any) {
      const status = e?.response?.status;
      const responseData = e?.response?.data;
      const url = e?.config?.url;
      let reqBody: any = e?.config?.data;
      try {
        reqBody = typeof reqBody === "string" ? JSON.parse(reqBody) : reqBody;
      } catch {}
      strapi.log.error(
        `[anipo] http error endpoint=/backend/api/getBarcode/ message=${
          e?.message
        } status=${status} url=${url} request=${toJson(
          maskKeyword(reqBody)
        )} response=${toJson(responseData)}`
      );
      return { ok: false, error: "network_error" };
    }
  },

  async remaining(): Promise<{
    ok: boolean;
    remaining?: number;
    error?: string;
  }> {
    const { keyword } = getConfig();
    if (!keyword) return { ok: false, error: "missing_keyword" };
    try {
      const { data } = await http().post<{
        status: boolean;
        remaining?: number;
        message?: string;
      }>("/backend/api/remaining/", { keyword });
      if (data?.status && typeof data.remaining === "number") {
        return { ok: true, remaining: data.remaining };
      }
      return { ok: false, error: data?.message || "anipo_error" };
    } catch (e: any) {
      strapi.log.error(
        `[anipo] remaining error message=${e?.message} response=${toJson(
          e?.response?.data
        )}`
      );
      return { ok: false, error: "network_error" };
    }
  },

  async paymentGatewayLink(input: {
    price: number;
    callbackUrl: string;
  }): Promise<{ ok: boolean; link?: string; error?: string }> {
    const { keyword } = getConfig();
    if (!keyword) return { ok: false, error: "missing_keyword" };
    try {
      const { data } = await http().post<{
        status: boolean;
        link?: string;
        message?: string;
      }>("/backend/api/paymentGatewayLink/", {
        keyword,
        price: Math.max(0, Math.floor(input.price || 0)),
        callbackUrl: input.callbackUrl,
      });
      if (data?.status && data.link) {
        return { ok: true, link: data.link };
      }
      return { ok: false, error: data?.message || "anipo_error" };
    } catch (e: any) {
      strapi.log.error(
        `[anipo] paymentGatewayLink error message=${
          e?.message
        } response=${toJson(e?.response?.data)}`
      );
      return { ok: false, error: "network_error" };
    }
  },
});
