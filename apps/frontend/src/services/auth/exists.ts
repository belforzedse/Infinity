import { apiClient } from "../index";
import { ENDPOINTS } from "@/constants/api";
import { normalizePhoneNumber } from "@/utils/auth";

export interface UserExistsResponse {
  hasUser: boolean;
}

export const checkUserExists = async (phoneNumber: string): Promise<UserExistsResponse> => {
  const endpoint = ENDPOINTS.AUTH.EXISTS;
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  const response = await apiClient.post<UserExistsResponse>(endpoint, {
    phone: normalizedPhone,
  });

  return response as any;
};
