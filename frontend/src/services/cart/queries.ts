import { apiClient } from "../index";
import type {
  CartStockCheckResponse,
  CheckoutGatewayCode,
} from "./types/cart";
import { DEFAULT_CHECKOUT_GATEWAYS } from "./types/cart";
import { unwrap } from "./helpers/response";
import { CHECKOUT_MAX_RETRIES, CHECKOUT_REQUEST_TIMEOUT_MS } from "@/constants/api";

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

interface AvailableGatewaysResponse {
  gateways?: Array<{
    code?: string;
    title?: string;
  }>;
}

export const checkCartStock = async (): Promise<CartStockCheckResponse> => {
  const response = await apiClient.get<CartStockCheckResponse>("/carts/check-stock");
  return unwrap<CartStockCheckResponse>(response);
};

export const getSnappEligible = async (
  params: {
    amount?: number;
    shippingId?: number;
    shippingCost?: number;
    discountCode?: string;
  } = {},
): Promise<SnappEligibilityResponse> => {
  const qs = new URLSearchParams();
  if (params.amount) qs.set("amount", String(params.amount));
  if (params.shippingId) qs.set("shippingId", String(params.shippingId));
  if (params.shippingCost) qs.set("shippingCost", String(params.shippingCost));
  if (params.discountCode) qs.set("discountCode", params.discountCode);

  const query = qs.toString();

  const url = `/payment-gateway/snapp-eligible${query ? `?${query}` : ""}`;


  try {
    const response = await apiClient.get<SnappEligibilityResponse>(url, {
      timeout: CHECKOUT_REQUEST_TIMEOUT_MS,
      retries: CHECKOUT_MAX_RETRIES,
    });
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


  try {
    const response = await apiClient.post<ShippingPreviewResponse>("/carts/shipping-preview", resolved);

    return unwrap<ShippingPreviewResponse>(response) ?? { success: false, shipping: 0 };
  } catch {
    return { success: false, shipping: 0 };
  }
};

export const getAvailableGateways = async (): Promise<CheckoutGatewayCode[]> => {
  try {
    const response = await apiClient.get<AvailableGatewaysResponse>("/payment-gateway/available", {
      timeout: CHECKOUT_REQUEST_TIMEOUT_MS,
      retries: CHECKOUT_MAX_RETRIES,
    });
    const payload = unwrap<AvailableGatewaysResponse>(response);
    const gatewayCodes = (payload?.gateways || [])
      .map((item) => String(item?.code || "").toLowerCase())
      .filter(
        (code): code is CheckoutGatewayCode =>
          code === "samankish" || code === "mellat" || code === "snappay" || code === "wallet",
      );

    return gatewayCodes;
  } catch {
    return [...DEFAULT_CHECKOUT_GATEWAYS];
  }
};
