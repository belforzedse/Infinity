import { apiClient } from "../index";
import type { ActiveReserveResponse } from "../cart/types/cart";

/**
 * Get the user's active reserve order (if any), with all linked orders in the group.
 * API returns body { data: null } or { data: { reserveGroupId, reserveExpiresAt, orders, orderCount } }.
 * We return that shape so callers (e.g. Bill) can use result.data.
 */
export const getActiveReserve = async (): Promise<ActiveReserveResponse> => {
  const response = await apiClient.get<ActiveReserveResponse>("/orders/active-reserve");
  return response.data;
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
