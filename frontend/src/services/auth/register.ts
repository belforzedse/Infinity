import { apiClient } from "../index";
import { ENDPOINTS } from "@/constants/api";

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
}

export interface Response {
  message?: string;
  token?: string;
}

export const register = async (payload: RegisterRequest): Promise<Response> => {
  const endpoint = ENDPOINTS.AUTH.REGISTER;

  const response = await apiClient.post<Response>(endpoint, payload);

  return response as Response;
};
