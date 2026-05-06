import { apiClient } from "@/services";
import { toast } from "react-hot-toast";
import { handleAuthErrors } from "@/utils/auth";

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

/**
 * Response shape from /sp/plugin-users endpoint
 * The backend returns the created user object directly in the response data
 */
export interface CreateUserResponse {
  success: boolean;
  data?: {
    id: number;
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
    const requestPayload: Record<string, string | number | undefined> = {
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

    const response = await apiClient.post<{ id: number; [key: string]: any }>(endpoint, requestPayload);

    // Backend returns the user object directly in response.data
    // The response from apiClient.post is ApiResponse<T>, so access via response.data
    const userId = response?.data?.id;

    if (!userId) {
      throw new Error("User ID not found in response");
    }

    return {
      success: true,
      data: {
        ...response.data,
        id: userId, // Ensure id is set (in case response.data doesn't have it)
      },
    };
  } catch (error: any) {
    // Handle authentication errors first
    handleAuthErrors(error);
    
    const errorMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error?.message ||
      "خطا در ایجاد کاربر";
    toast.error(errorMessage);
    return { success: false, error };
  }
};

