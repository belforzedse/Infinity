import { apiClient } from "../index";
import { ENDPOINTS } from "@/constants/api";
import { normalizePhoneNumber } from "@/utils/auth";

export interface Response {
  token: string;
}

export const loginPassword = async (phone: string, password: string): Promise<Response> => {
  const endpoint = ENDPOINTS.AUTH.LOGIN_PASSWORD;

  const response = await apiClient.post<Response>(
    endpoint,
    {
      phone: normalizePhoneNumber(phone),
      password,
    },
    { suppressAuthRedirect: true },
  );

  return response as any;
};
