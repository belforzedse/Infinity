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
      },
    };
    try {
      const { data } = await http().post<BarcodePriceResponse>(
        "/backend/api/barcodePrice/",
        body
      );
      if (data?.status && typeof data.data === "number") {
        return { ok: true, price: data.data };
      }
      return { ok: false, error: data?.message || "anipo_error" };
    } catch (e: any) {
      strapi.log.error("Anipo barcodePrice error", e?.message || e);
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
        call_number: input.callNumber || "",
        address: input.address,
        weight: Math.max(1, Math.floor(input.weight || 1)),
        boxSizeId: input.boxSizeId,
        isnonstandard: input.isnonstandard ?? 0,
        sum: Math.max(0, Math.floor(input.sum || 0)),
      },
    };
    try {
      const { data } = await http().post<GetBarcodeResponse>(
        "/backend/api/getBarcode/",
        body
      );
      if (data?.status && data.data) {
        return { ok: true, data: data.data };
      }
      return { ok: false, error: data?.message || "anipo_error" };
    } catch (e: any) {
      strapi.log.error("Anipo getBarcode error", e?.message || e);
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
      strapi.log.error("Anipo remaining error", e?.message || e);
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
      strapi.log.error("Anipo paymentGatewayLink error", e?.message || e);
      return { ok: false, error: "network_error" };
    }
  },
});
