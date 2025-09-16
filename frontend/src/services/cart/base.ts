import { apiClient } from "../index";
import { CartResponse } from "./types/cart";

export const getUserCart = async (): Promise<CartResponse> => {
  const response = await apiClient.get<CartResponse>("/carts/me");
  return response.data;
};
