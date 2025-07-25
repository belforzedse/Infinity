import { apiClient } from "../index";
import { ENDPOINTS } from "@/constants/api";

export interface UserExistsResponse {
  hasUser: boolean;
}

export const checkUserExists = async (
  phoneNumber: string
): Promise<UserExistsResponse> => {
  const endpoint = ENDPOINTS.AUTH.EXISTS;

  const response = await apiClient.post<UserExistsResponse>(endpoint, {
    phone: phoneNumber,
  });

  return response as any;
};
