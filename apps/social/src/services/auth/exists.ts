import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
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

  return response as unknown as UserExistsResponse;
};
