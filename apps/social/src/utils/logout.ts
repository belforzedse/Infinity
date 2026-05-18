import { jotaiStore } from "@/lib/jotaiStore";
import { currentUserAtom, userErrorAtom, userLoadingAtom } from "@/lib/atoms/auth";
import { clearAccessToken } from "@/utils/accessToken";
import { clearAllCommentDrafts } from "@/lib/offline-snapshots";

/**
 * Social app logout — mirrors storefront `performLogout` intent: clear token, clear auth atoms, hard-navigate to `/auth`.
 */
export function performLogout(): void {
  if (typeof window === "undefined") return;

  try {
    jotaiStore.set(currentUserAtom, null);
    jotaiStore.set(userErrorAtom, null);
    jotaiStore.set(userLoadingAtom, false);

    try {
      sessionStorage.removeItem("otpToken");
      localStorage.removeItem("pendingPhone");
    } catch {
      // ignore storage errors (private mode, etc.)
    }

    clearAccessToken();
    clearAllCommentDrafts();
    window.location.href = "/auth";
  } catch (error) {
    console.error("[Logout] Error during logout:", error);
    window.location.href = "/auth";
  }
}
