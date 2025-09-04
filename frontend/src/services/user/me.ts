import { apiClient } from "../index";
import { ENDPOINTS, HTTP_STATUS } from "@/constants/api";
import { handleAuthErrors } from "@/utils/auth";

export interface MeResponse {
  Bio: string | null;
  BirthDate: string | null;
  FirstName: string;
  IsActive: boolean;
  IsVerified: boolean;
  LastName: string;
  NationalCode: string | null;
  Phone: string;
  Sex: string | null;
  createdAt: string;
  id: number;
  updatedAt: string;
  isAdmin?: boolean;
}

export const me = async (requireAdmin: boolean = false): Promise<MeResponse> => {
  const endpoint = `${ENDPOINTS.USER.ME}`;
  const accessToken = localStorage.getItem("accessToken");

  try {
    const response = await apiClient.get<MeResponse>(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Get the actual response data
    const userData = response as any;

    // Only enforce admin check when explicitly required
    if (requireAdmin) {
      handleAuthErrors(null, userData?.isAdmin);
    }

    return userData;
  } catch (error: any) {
    // Handle authentication errors and redirect if needed
    handleAuthErrors(error);

    throw error;
  }
};
