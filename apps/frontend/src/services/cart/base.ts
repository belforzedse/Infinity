import { apiClient } from "../index";
import type { CartResponse } from "./types/cart";

export const getUserCart = async (): Promise<CartResponse> => {
  const response = await apiClient.get<CartResponse>("/carts/me");
  return response.data;
};
