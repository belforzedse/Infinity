import { ENDPOINTS } from "@/constants/api"; // removed unused: HTTP_STATUS
import { handleAuthErrors } from "@/utils/auth";
import type { ApiError } from "@/types/api";
import { apiClient } from "@/lib/api-client";

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

type MaybeApiResponse<T> = T | { data: T };
function hasData<T>(p: unknown): p is { data: T } {
  return typeof p === "object" && p !== null && "data" in (p as Record<string, unknown>);
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

    // Get the actual response data regardless of shape
    const payload = response as MaybeApiResponse<MeResponse>;
    const userData: MeResponse = hasData<MeResponse>(payload)
      ? payload.data
      : (payload as MeResponse);

    // Only enforce admin check when explicitly required
    if (requireAdmin) {
      const rolesUnknown = (userData as unknown as { roles?: unknown }).roles;
      const hasAdminRole = Array.isArray(rolesUnknown)
        ? rolesUnknown.some((r: unknown) => {
            if (typeof r === "string") return r === "admin";
            if (typeof r === "object" && r && "name" in (r as Record<string, unknown>)) {
              const name = (r as { name?: unknown }).name;
              return name === "admin";
            }
            return false;
          })
        : false;
      const isAdmin =
        !!(userData as { isAdmin?: boolean }).isAdmin ||
        !!(userData as unknown as { IsAdmin?: boolean }).IsAdmin ||
        hasAdminRole;
      handleAuthErrors(null, isAdmin);
    }

    return userData;
  } catch (error: unknown) {
    // Handle authentication errors and redirect if needed
    handleAuthErrors(error as ApiError);

    throw error;
  }
};
