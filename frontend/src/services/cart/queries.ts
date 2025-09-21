import { apiClient } from "../index";
import { CartStockCheckResponse } from "./types/cart";
import { unwrap } from "./helpers/response";
import type { ApiResponse } from "@/types/api";

export const checkCartStock = async (): Promise<CartStockCheckResponse> => {
  const response = await apiClient.get<CartStockCheckResponse>("/carts/check-stock");
  return response as any;
};

export const getSnappEligible = async (
  params: {
    shippingId?: number;
    shippingCost?: number;
    discountCode?: string;
  } = {},
): Promise<{
  eligible: boolean;
  title?: string;
  description?: string;
  amountIRR?: number;
}> => {
  const qs = new URLSearchParams();
  if (params.shippingId) qs.set("shippingId", String(params.shippingId));
  if (params.shippingCost) qs.set("shippingCost", String(params.shippingCost));
  if (params.discountCode) qs.set("discountCode", String(params.discountCode));
  const url = `/payment-gateway/snapp-eligible${qs.toString() ? `?${qs.toString()}` : ""}`;
  try {
    const response = await apiClient.get<
      ApiResponse<{
        eligible: boolean;
        title?: string;
        description?: string;
        amountIRR?: number;
      }>
    >(url);
    return unwrap(response) || { eligible: false };
  } catch (e) {
    // Keep callers in control; they will preserve previous state on error
    console.error("getSnappEligible error:", e);
    return { eligible: false };
  }
};

export const getShippingPreview = async (params: {
  addressId: number;
  shippingId: number;
}): Promise<{
  success: boolean;
  shipping: number;
  weight?: number;
  message?: string;
}> => {
  try {
    const response = await apiClient.post<
      ApiResponse<{
        success: boolean;
        shipping: number;
        weight?: number;
        message?: string;
      }>
    >("/carts/shipping-preview", params);
    return unwrap(response) || { success: false, shipping: 0 };
  } catch (e) {
    console.error("getShippingPreview error:", e);
    return { success: false, shipping: 0 };
  }
};
