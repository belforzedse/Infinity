/**
 * Centralized logout utility
 * Ensures consistent logout behavior across the app:
 * 1. Removes auth token from localStorage
 * 2. Clears cached user data (prevents flash of old user on next login)
 * 3. Redirects to auth page
 *
 * Usage:
 *   import { performLogout } from '@/utils/logout'
 *   performLogout() // Logs out user and redirects to /auth
 */

import { jotaiStore } from "@/lib/jotaiStore";
import { currentUserAtom, userErrorAtom } from "@/lib/atoms/auth";

export async function performLogout(): Promise<void> {
  try {
    // 1. Clear user atom to prevent showing cached user content
    if (typeof window !== "undefined") {
      jotaiStore.set(currentUserAtom, null);
      jotaiStore.set(userErrorAtom, null);
    }

    // 2. Remove auth token (triggers storage event listener in AuthInitializer)
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
    }

    // 3. Redirect to auth page
    if (typeof window !== "undefined") {
      window.location.href = "/auth";
    }
  } catch (error) {
    console.error("[Logout] Error during logout:", error);
    // Even if something fails, redirect to auth page
    if (typeof window !== "undefined") {
      window.location.href = "/auth";
    }
  }
}
