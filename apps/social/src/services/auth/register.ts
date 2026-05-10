import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import { normalizePhoneNumber } from "@/utils/auth";

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
  birthDate?: string;
}

export interface RegisterResponse {
  message?: string;
  token?: string;
}

export const register = async (payload: RegisterRequest): Promise<RegisterResponse> => {
  const endpoint = ENDPOINTS.AUTH.REGISTER;

  const normalizedPayload = {
    ...payload,
    phone: payload.phone ? normalizePhoneNumber(payload.phone) : undefined,
  };

  const response = await apiClient.post<RegisterResponse>(endpoint, normalizedPayload);

  return response as RegisterResponse;
};
