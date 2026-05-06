import { apiClient } from "../index";
import { unwrap } from "./helpers/response";

type DiscountPayload =
  | string
  | {
      code: string;
      shippingId?: number;
      shippingCost?: number;
    };

interface DiscountResponse {
  success: boolean;
  code: string;
  type: "Discount" | "Cash";
  amount: number;
  discount: number;
  summary: {
    subtotal: number;
    eligibleSubtotal: number;
    tax: number;
    shipping: number;
    total: number;
    taxPercent: number;
  };
}

const normaliseDiscountPayload = (payload: DiscountPayload) =>
  typeof payload === "string" ? { code: payload } : payload;

export const applyDiscount = async (payload: DiscountPayload): Promise<DiscountResponse> => {
  const response = await apiClient.post<DiscountResponse>("/carts/apply-discount", normaliseDiscountPayload(payload));
  return unwrap<DiscountResponse>(response);
};
