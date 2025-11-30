import { apiClient } from "@/services";
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
 * Create a new plugin user in super-admin
 * Creates a plugin user (users-permissions.user) with all related records
 */
export const createUser = async (payload: CreateUserRequest): Promise<CreateUserResponse> => {
  try {
    const endpoint = "/sp/plugin-users";

    // Prepare the request payload with all fields
    const requestPayload: any = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      password: payload.password,
      phone: payload.phone.trim(),
    };

    // Add optional fields if provided
    if (payload.birthDate) {
      requestPayload.birthDate = payload.birthDate;
    }
    if (payload.nationalCode) {
      requestPayload.nationalCode = payload.nationalCode;
    }
    if (payload.bio) {
      requestPayload.bio = payload.bio;
    }
    if (payload.role) {
      requestPayload.role = payload.role;
    }

    const response = await apiClient.post(endpoint, requestPayload);

    // Extract user ID from response
    // Backend returns the user object directly, so check response.data first, then response
    const userId =
      (response as any)?.data?.id ||
      (response as any)?.id ||
      (response as any)?.data?.user?.id ||
      (response as any)?.user?.id;

    return {
      success: true,
      data: {
        ...response,
        id: userId,
        user: userId ? { id: userId } : undefined,
      },
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      "خطا در ایجاد کاربر";
    toast.error(errorMessage);
    return { success: false, error };
  }
};

