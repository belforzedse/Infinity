import { HTTP_STATUS } from "@/constants/api";

/**
 * Handles authentication errors (401, 403) or non-admin access
 * and redirects to auth page when necessary
 */
export const handleAuthErrors = (error?: any, isAdminCheck?: boolean): void => {
  // TODO: Replace `any` with a specific error type for stricter checking
  // Check for auth errors
  const isAuthError =
    error?.status === HTTP_STATUS.UNAUTHORIZED || error?.status === HTTP_STATUS.FORBIDDEN;

  // Check for non-admin access
  const isNotAdmin = isAdminCheck === false;

  if (isAuthError || isNotAdmin) {
    // Avoid performing navigation in test environments (jsdom throws)
    const isJest = typeof process !== "undefined" && process.env?.JEST_WORKER_ID;

    if (typeof window !== "undefined") {
      // Only clear token on an auth error, not on explicit non-admin check.
      if (isAuthError) {
        localStorage.removeItem("accessToken");
      }

      // Redirect to auth page for real environments, skip in Jest tests.
      if (!isJest) {
        // FIXME: Use Next.js router for navigation in the app runtime
        try {
          window.location.href = "/auth";
        } catch {
          // Some environments (like older jsdom) throw on navigation.
        }
      }
    }
  }
};
