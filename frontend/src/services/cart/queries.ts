import { apiClient } from "../index";
import { CartStockCheckResponse } from "./types/cart";
import { unwrap } from "./helpers/response";

export const checkCartStock = async (): Promise<CartStockCheckResponse> => {
  const response = await apiClient.get<CartStockCheckResponse>(
    "/carts/check-stock"
  );
  return response as any;
};

export const getSnappEligible = async (
  params: { shippingId?: number; shippingCost?: number } = {}
): Promise<{
  eligible: boolean;
  title?: string;
  description?: string;
  amountIRR?: number;
}> => {
  const qs = new URLSearchParams();
  if (params.shippingId) qs.set("shippingId", String(params.shippingId));
  if (params.shippingCost) qs.set("shippingCost", String(params.shippingCost));
  const url = `/payment-gateway/snapp-eligible${
    qs.toString() ? `?${qs.toString()}` : ""
  }`;
  const response = await apiClient.get<any>(url);
  return unwrap(response) || { eligible: false };
};
