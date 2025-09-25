import { apiClient } from "../index";
import type { CartStockCheckResponse } from "./types/cart";
import { unwrap } from "./helpers/response";

type SnappEligibilityResponse = {
  eligible: boolean;
  title?: string;
  description?: string;
  amountIRR?: number;
};

type ShippingPreviewResponse = {
  success: boolean;
  shipping: number;
  weight?: number;
  message?: string;
};

export const checkCartStock = async (): Promise<CartStockCheckResponse> => {
  const response = await apiClient.get<CartStockCheckResponse>("/carts/check-stock");
  return unwrap<CartStockCheckResponse>(response);
};

export const getSnappEligible = async (
  params: {
    shippingId?: number;
    shippingCost?: number;
    discountCode?: string;
  } = {},
): Promise<SnappEligibilityResponse> => {
  const qs = new URLSearchParams();
  if (params.shippingId) qs.set("shippingId", String(params.shippingId));
  if (params.shippingCost) qs.set("shippingCost", String(params.shippingCost));
  if (params.discountCode) qs.set("discountCode", params.discountCode);

  const query = qs.toString();
  const url = `/carts/snapp-eligible${query ? `?${query}` : ""}`;

  try {
    const response = await apiClient.get<SnappEligibilityResponse>(url);
    return unwrap<SnappEligibilityResponse>(response) ?? { eligible: false };
  } catch {
    return { eligible: false };
  }
};

export const getShippingPreview = async (
  params:
    | number
    | {
        addressId: number;
        shippingId?: number;
        shippingCost?: number;
      },
): Promise<ShippingPreviewResponse> => {
  const resolved =
    typeof params === "number"
      ? { addressId: params }
      : { addressId: params.addressId, shippingId: params.shippingId, shippingCost: params.shippingCost };

  const qs = new URLSearchParams({ addressId: String(resolved.addressId) });
  if (resolved.shippingId) qs.set("shippingId", String(resolved.shippingId));
  if (typeof resolved.shippingCost === "number") qs.set("shippingCost", String(resolved.shippingCost));

  const url = `/carts/shipping-preview${qs.toString() ? `?${qs.toString()}` : ""}`;

  try {
    const response = await apiClient.get<ShippingPreviewResponse>(url);
    return unwrap<ShippingPreviewResponse>(response) ?? { success: false, shipping: 0 };
  } catch {
    return { success: false, shipping: 0 };
  }
};
