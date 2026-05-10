import { HTTP_STATUS } from "@repo/api/config";
import type { ApiError } from "@repo/api/types";
import { currentUserAtom } from "@/lib/atoms/auth";
import { jotaiStore } from "@/lib/jotaiStore";
import { clearAccessToken } from "@/utils/accessToken";

/**
 * Clears session on 401; clears cached user on 403. Social app has no global error banner—callers use toasts.
 */
export function handleAuthErrors(error?: ApiError | null, isAdminCheck?: boolean): void {
  const isUnauthorized = error?.status === HTTP_STATUS.UNAUTHORIZED;
  const isForbidden = error?.status === HTTP_STATUS.FORBIDDEN;
  const isNotAdmin = isAdminCheck === false;

  if (!isUnauthorized && !isForbidden && !isNotAdmin) {
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  if (isUnauthorized) {
    clearAccessToken();
    jotaiStore.set(currentUserAtom, null);
    return;
  }

  if (isForbidden) {
    jotaiStore.set(currentUserAtom, null);
  }
}

export function getAccessTokenFromStorage(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return localStorage.getItem("accessToken");
  } catch {
    return null;
  }
}

export function normalizePhoneNumber(value: string): string {
  if (!value) return value;
  let trimmed = value.trim();
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("0")) trimmed = trimmed.substring(1);
  if (!trimmed.startsWith("98")) trimmed = `98${trimmed}`;
  return `+${trimmed}`;
}
