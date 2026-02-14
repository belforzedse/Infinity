import { apiClient } from "../index";
import type { ActiveReserveResponse } from "../cart/types/cart";

/**
 * Get the user's active reserve order (if any), with all linked orders in the group.
 * Returns the full API shape { data: { reserveGroupId, ... } | null } so callers can use .data.
 */
export const getActiveReserve = async (): Promise<ActiveReserveResponse> => {
  const response = await apiClient.get<ActiveReserveResponse>("/orders/active-reserve");
  // API returns { data: null } or { data: { reserveGroupId, reserveExpiresAt, orders, orderCount } }.
  // Return that shape so callers (e.g. Bill) can use result.data.
  if (response != null && typeof response === "object" && "data" in response) {
    return response as unknown as ActiveReserveResponse;
  }
  // If response was unwrapped (payload only), normalize to { data: payload } or { data: null }
  if (response != null && typeof response === "object" && "reserveGroupId" in response) {
    return { data: response as ActiveReserveResponse["data"] };
  }
  return { data: null };
};

/**
 * Manually end the reserve window for an order ("Ship Now").
 * Clears reserve flags on all orders in the group.
 */
export const releaseReserve = async (orderId: number): Promise<{ data: { success: boolean; message: string; orderCount: number } }> => {
  const response = await apiClient.post<{ data: { success: boolean; message: string; orderCount: number } }>(
    `/orders/${orderId}/release-reserve`
  );
  return response.data;
};
