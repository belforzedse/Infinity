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
import { addressesAtom, addressesLoadingAtom, addressesErrorAtom } from "@/atoms/addressesAtom";
import { likedProductsAtom, likedProductsLoadedAtom, __resetUseProductLikeState } from "@/hooks/useProductLike";
import { submitOrderStepAtom, orderIdAtom, orderNumberAtom, transactionIdAtom } from "@/atoms/Order";
import { SubmitOrderStep } from "@/types/Order";
import { __clearOrderCache } from "@/services/order";
import { invalidateAddressCache } from "@/services/user/addresses";
import { clearAccessToken } from "@/utils/accessToken";
import { apiCache } from "@/lib/api-cache";

/**
 * Clear all user-specific storage and cache entries
 * Should be called on logout and when switching users
 */
export function clearUserStorage(): void {
  if (typeof window === "undefined") return;

  try {
    // Clear localStorage items
    localStorage.removeItem("discountCode");
    localStorage.removeItem("recentSearches");

    // Clear sessionStorage items
    sessionStorage.removeItem("tempPreInvoiceOrder");
    sessionStorage.removeItem("otpToken");

    // Clear all order detail cache entries (pattern: infinity:order-detail:*)
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith("infinity:order-detail:")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));

    // Clear user-specific API cache entries
    const userSpecificPatterns = [
      /\/api\/users\//i,
      /\/api\/local-user\//i,
      /\/api\/orders\//i,
      /\/api\/carts\//i,
      /\/api\/wallet\//i,
      /\/api\/product-likes\//i,
      /\/api\/local-user-addresses\//i,
    ];

    userSpecificPatterns.forEach((pattern) => {
      apiCache.clearByPattern(pattern);
    });
  } catch (error) {
    // Ignore storage errors (e.g., in private browsing mode)
    console.warn("[Logout] Error clearing user storage:", error);
  }
}

export async function performLogout(): Promise<void> {
  try {
    // 1. Clear user atom to prevent showing cached user content
    if (typeof window !== "undefined") {
      jotaiStore.set(currentUserAtom, null);
      jotaiStore.set(userErrorAtom, null);
      // Clear address atoms to prevent showing previous user's addresses
      jotaiStore.set(addressesAtom, []);
      jotaiStore.set(addressesLoadingAtom, false);
      jotaiStore.set(addressesErrorAtom, null);
      // Clear liked products to prevent showing previous user's favorites
      jotaiStore.set(likedProductsAtom, []);
      jotaiStore.set(likedProductsLoadedAtom, false);
      __resetUseProductLikeState();
      // Clear order-related atoms
      jotaiStore.set(orderIdAtom, null);
      jotaiStore.set(orderNumberAtom, null);
      jotaiStore.set(transactionIdAtom, null);
      jotaiStore.set(submitOrderStepAtom, SubmitOrderStep.Table);
      try {
        localStorage.removeItem("refreshToken");
      } catch {
        // ignore storage errors
      }
    }

    // 2. Remove auth token (triggers storage event listener in AuthInitializer)
    clearAccessToken();
    __clearOrderCache();
    invalidateAddressCache();
    // Clear all user-specific storage and cache
    clearUserStorage();

    // 3. Redirect to auth page
    if (typeof window !== "undefined") {
      window.location.href = "/auth";
    }
  } catch (error) {
    console.error("[Logout] Error during logout:", error);
    // Even if something fails, redirect to auth page
    if (typeof window !== "undefined") {
      __clearOrderCache();
      window.location.href = "/auth";
    }
  }
}
