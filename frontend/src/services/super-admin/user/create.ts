import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import { normalizePhoneNumber } from "@/utils/auth";
import { toast } from "react-hot-toast";

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
  birthDate?: string;
  nationalCode?: string;
  bio?: string;
  role?: number;
}

export interface CreateUserResponse {
  success: boolean;
  data?: {
    user?: {
      id: number;
      [key: string]: any;
    };
    id?: number;
    [key: string]: any;
  };
  error?: any;
}

/**
 * Create a new user in super-admin (skips OTP verification)
 * Uses the same registration endpoint but for admin use
 */
export const createUser = async (payload: CreateUserRequest): Promise<CreateUserResponse> => {
  try {
    const endpoint = ENDPOINTS.AUTH.REGISTER;

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(payload.phone);

    // Prepare the request payload
    const requestPayload: any = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      password: payload.password, // Backend will hash this
      phone: normalizedPhone,
    };

    // Add optional fields if provided
    if (payload.birthDate) {
      requestPayload.birthDate = payload.birthDate;
    }

    const response = await apiClient.post(endpoint, requestPayload);

    // Extract user ID from response (response structure may vary)
    const userId = (response as any)?.user?.id || (response as any)?.data?.user?.id || (response as any)?.id;

    // After user is created, update additional info if provided
    if (userId && (payload.nationalCode || payload.bio)) {
      try {
        await apiClient.put(`/sp/local-users/${userId}`, {
          firstName: payload.firstName,
          lastName: payload.lastName,
          ...(payload.birthDate && { birthDate: payload.birthDate }),
          ...(payload.nationalCode && { nationalCode: payload.nationalCode }),
          ...(payload.bio && { bio: payload.bio }),
        });
      } catch (error) {
        console.error("Error updating user info:", error);
        // Don't fail the whole operation if info update fails
      }
    }

    // Update role if provided
    if (userId && payload.role) {
      try {
        await apiClient.put(`/users/${userId}`, {
          role: payload.role,
        });
      } catch (error) {
        console.error("Error updating user role:", error);
        // Don't fail the whole operation if role update fails
      }
    }

    return { success: true, data: { ...response, id: userId } };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error?.message || "خطا در ایجاد کاربر";
    toast.error(errorMessage);
    return { success: false, error };
  }
};

