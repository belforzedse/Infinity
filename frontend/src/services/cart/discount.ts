import { apiClient } from "../index";

export const applyDiscount = async (params: {
  code: string;
  shippingId?: number;
  shippingCost?: number;
}): Promise<{
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
}> => {
  const response = await apiClient.post<any>("/carts/apply-discount", params);
  return (response as any).data || (response as any);
};
