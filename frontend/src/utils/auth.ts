import { HTTP_STATUS } from "@/constants/api";
import { ApiError } from "@/types/api";

/**
 * Handles authentication errors (401, 403) or non-admin access
 * and redirects to auth page when necessary
 */
export const handleAuthErrors = (
  error?: ApiError | null,
  isAdminCheck?: boolean,
): void => {
  // Check for auth errors
  const isAuthError =
    error?.status === HTTP_STATUS.UNAUTHORIZED ||
    error?.status === HTTP_STATUS.FORBIDDEN;

  // Check for non-admin access
  const isNotAdmin = isAdminCheck === false;

  if (typeof window === "undefined") return;

  if (isAuthError) {
    // Only clear token on actual auth errors
    localStorage.removeItem("accessToken");
    window.location.href = "/auth";
    return;
  }

  if (isNotAdmin) {
    // Do NOT clear token; just send user to their account/home
    // This avoids kicking valid users back to login during admin checks
    window.location.href = "/account";
  }
};
