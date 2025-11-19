import { HTTP_STATUS } from "@/constants/api";
import { jotaiStore } from "@/lib/jotaiStore";
import { errorNotificationsAtom, addErrorNotification } from "@/lib/atoms/errors";
import { currentUserAtom } from "@/lib/atoms/auth";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";
import { ACCESS_TOKEN_STORAGE_KEY, clearAccessToken } from "@/utils/accessToken";

/**
 * Handles authentication errors (401, 403) gracefully
 * Shows user-friendly notifications instead of hard redirects
 *
 * 401 (Unauthorized): Shows notification with login link
 * 403 (Forbidden): Shows notification explaining permission denied
 * isAdminCheck: Shows notification instead of redirecting
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

  // 401: User not authenticated
  if (isUnauthorized) {
    // Clear auth state immediately
    clearAccessToken();
    jotaiStore.set(currentUserAtom, null);

    // Show friendly notification (no hard redirect)
    if (!isJest) {
      const notification = addErrorNotification(
        401,
        getUserFacingErrorMessage(error, "برای ادامه وارد حساب کاربری خود شوید"),
      );
      jotaiStore.set(errorNotificationsAtom, (prev) => [...prev, notification]);
    }
    return;
  }

  // 403: User forbidden/permission denied
  if (isForbidden) {
    if (!isJest) {
      const notification = addErrorNotification(
        403,
        getUserFacingErrorMessage(error, "شما اجازه دسترسی به این منطقه را ندارید"),
      );
      jotaiStore.set(errorNotificationsAtom, (prev) => [...prev, notification]);
    }
    return;
  }

  // isNotAdmin: Not an admin user
  if (isNotAdmin && !isJest) {
    const notification = addErrorNotification(
      403,
      "این صفحه فقط برای مدیران دسترسی دارد",
    );
    jotaiStore.set(errorNotificationsAtom, (prev) => [...prev, notification]);
  }
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Normalizes Iranian phone numbers to the +98XXXXXXXXXX format
 * Converts from formats like:
 * - 09XXXXXXXXX → +989XXXXXXXXX
 * - 989XXXXXXXXX → +989XXXXXXXXX
 * - +989XXXXXXXXX → +989XXXXXXXXX (unchanged)
 */
export function normalizePhoneNumber(value: string): string {
  if (!value) return value;
  let trimmed = value.trim();
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("0")) trimmed = trimmed.substring(1);
  if (!trimmed.startsWith("98")) trimmed = `98${trimmed}`;
  return `+${trimmed}`;
}
