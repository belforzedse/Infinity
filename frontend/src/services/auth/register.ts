import { apiClient } from "../index";
import { ENDPOINTS } from "@/constants/api";
import { normalizePhoneNumber } from "@/utils/auth";

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
  birthDate?: string;
}

export interface Response {
  message?: string;
  token?: string;
}

export const register = async (payload: RegisterRequest): Promise<Response> => {
  const endpoint = ENDPOINTS.AUTH.REGISTER;

  const normalizedPayload = {
    ...payload,
    phone: payload.phone ? normalizePhoneNumber(payload.phone) : undefined,
  };

  const response = await apiClient.post<Response>(endpoint, normalizedPayload);

  return response as Response;
};
