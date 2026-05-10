import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import { normalizePhoneNumber } from "@/utils/auth";

export interface LoginPasswordResponse {
  token: string;
}

export const loginPassword = async (
  phone: string,
  password: string,
): Promise<LoginPasswordResponse> => {
  const endpoint = ENDPOINTS.AUTH.LOGIN_PASSWORD;

  const response = await apiClient.post<LoginPasswordResponse>(
    endpoint,
    {
      phone: normalizePhoneNumber(phone),
      password,
    },
    { suppressAuthRedirect: true },
  );

  return response as unknown as LoginPasswordResponse;
};
