import { apiClient } from "../index";
import type { FinalizeCartRequest, FinalizeCartResponse, CartItemResponse } from "./types/cart";

export const addItemToCart = async (
  productVariationId: number,
  count: number,
): Promise<CartItemResponse> => {
  const response = await apiClient.post<CartItemResponse>("/carts/add-item", {
    productVariationId,
    count,
  });
  return response.data;
};

export const updateCartItem = async (
  cartItemId: number,
  count: number,
): Promise<CartItemResponse> => {
  const response = await apiClient.put<CartItemResponse>("/carts/update-item", {
    cartItemId,
    count,
  });
  return response.data;
};

export const removeCartItem = async (cartItemId: number): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/carts/remove-item/${cartItemId}`);
  return response as any;
};

export const finalizeCart = async (data: FinalizeCartRequest): Promise<FinalizeCartResponse> => {
  const response = await apiClient.post<FinalizeCartResponse>("/carts/finalize", data);
  return response.data;
};
