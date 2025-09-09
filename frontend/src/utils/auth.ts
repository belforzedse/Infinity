import { HTTP_STATUS } from "@/constants/api";

/**
 * Handles authentication errors (401, 403) or non-admin access
 * and redirects to auth page when necessary
 */
export const handleAuthErrors = (
  error?: any,
  isAdminCheck?: boolean,
): void => {
  // TODO: Replace `any` with a specific error type for stricter checking
  // Check for auth errors
  const isAuthError =
    error?.status === HTTP_STATUS.UNAUTHORIZED ||
    error?.status === HTTP_STATUS.FORBIDDEN;

  // Check for non-admin access
  const isNotAdmin = isAdminCheck === false;

  if (isAuthError || isNotAdmin) {
    // Clear the token
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");

      // Redirect to auth page
      window.location.href = "/auth"; // FIXME: Use Next.js router for navigation
    }
  }
};
