import { apiClient } from "../index";
import { unwrap } from "./helpers/response";
import type { FinalizeCartRequest, FinalizeCartResponse, CartItemResponse } from "./types/cart";

interface AddItemPayload {
  productVariationId: number;
  count: number;
}

interface UpdateItemPayload {
  cartItemId: number;
  count: number;
}

const normaliseAddItemPayload = (
  productVariationIdOrPayload: number | AddItemPayload,
  maybeCount?: number,
): AddItemPayload => {
  if (typeof productVariationIdOrPayload === "number") {
    if (typeof maybeCount !== "number") {
      throw new Error("Count must be provided when adding to cart by id");
    }

    return { productVariationId: productVariationIdOrPayload, count: maybeCount };
  }

  return productVariationIdOrPayload;
};

const normaliseUpdatePayload = (
  cartItemIdOrPayload: number | UpdateItemPayload,
  maybeCount?: number,
): UpdateItemPayload => {
  if (typeof cartItemIdOrPayload === "number") {
    if (typeof maybeCount !== "number") {
      throw new Error("Count must be provided when updating a cart item by id");
    }

    return { cartItemId: cartItemIdOrPayload, count: maybeCount };
  }

  return cartItemIdOrPayload;
};

export const addItemToCart = async (
  productVariationIdOrPayload: number | AddItemPayload,
  maybeCount?: number,
): Promise<CartItemResponse> => {
  const payload = normaliseAddItemPayload(productVariationIdOrPayload, maybeCount);
  const response = await apiClient.post("/carts/items", payload);
  return unwrap<CartItemResponse>(response);
};

export const updateCartItem = async (
  cartItemIdOrPayload: number | UpdateItemPayload,
  maybeCount?: number,
): Promise<CartItemResponse> => {
  const payload = normaliseUpdatePayload(cartItemIdOrPayload, maybeCount);
  const response = await apiClient.put(`/carts/items/${payload.cartItemId}`, {
    count: payload.count,
  });
  return unwrap<CartItemResponse>(response);
};

export const removeCartItem = async (cartItemId: number): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/carts/items/${cartItemId}`);
  return unwrap<{ message: string }>(response);
};

export const finalizeCart = async (data: FinalizeCartRequest): Promise<FinalizeCartResponse> => {
  const response = await apiClient.post<FinalizeCartResponse>("/carts/finalize", data);
  return unwrap<FinalizeCartResponse>(response);
};
