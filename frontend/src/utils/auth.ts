import { HTTP_STATUS } from "@/constants/api";

/**
 * Handles authentication errors (401, 403) or non-admin access
 * and redirects to auth page when necessary
 */
export const handleAuthErrors = (error?: any, isAdminCheck?: boolean): void => {
  // TODO: Replace `any` with a specific error type for stricter checking
  const isUnauthorized = error?.status === HTTP_STATUS.UNAUTHORIZED;
  const isForbidden = error?.status === HTTP_STATUS.FORBIDDEN;
  const isNotAdmin = isAdminCheck === false;

  if (!isUnauthorized && !isForbidden && !isNotAdmin) {
    return;
  }

  const isJest = typeof process !== "undefined" && process.env?.JEST_WORKER_ID;

  if (typeof window === "undefined") {
    return;
  }

  if (isUnauthorized) {
    localStorage.removeItem("accessToken");
  }

  if (!isJest && (isUnauthorized || isNotAdmin)) {
    try {
      window.location.href = "/auth";
    } catch {
      // Some environments (like older jsdom) throw on navigation.
    }
  }
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return localStorage.getItem("accessToken");
  } catch {
    return null;
  }
}
