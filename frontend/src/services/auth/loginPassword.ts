import { apiClient } from "../index";
import { ENDPOINTS } from "@/constants/api";

export interface Response {
  token: string;
}

export const loginPassword = async (phone: string, password: string): Promise<Response> => {
  const endpoint = ENDPOINTS.AUTH.LOGIN_PASSWORD;

  const response = await apiClient.post<Response>(
    endpoint,
    {
      phone: normalizePhone(phone),
      password,
    },
    { suppressAuthRedirect: true },
  );

  return response as any;
};

function normalizePhone(value: string) {
  if (!value) return value;
  let trimmed = value.trim();
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("0")) trimmed = trimmed.substring(1);
  if (!trimmed.startsWith("98")) trimmed = `98${trimmed}`;
  return `+${trimmed}`;
}
