"use client";

import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { currentUserAtom, userLoadingAtom, userErrorAtom } from "@/lib/atoms/auth";
import UserService from "@/services/user";
import { __clearOrderCache } from "@/services/order";
import { ACCESS_TOKEN_EVENT, ACCESS_TOKEN_STORAGE_KEY } from "@/utils/accessToken";

/**
 * AuthInitializer Component
 * Fetches the current user once at app startup and caches it globally
 * Prevents redundant API calls to /users/me endpoint
 *
 * Key Features:
 * - Detects logout by monitoring localStorage token removal
 * - Clears cached user immediately when logout is detected
 * - Prevents flash of old user content on logout → login flow
 * - Refreshes user data when token changes
 */
export default function AuthInitializer() {
  const [user, setUser] = useAtom(currentUserAtom);
  const [isLoading, setIsLoading] = useAtom(userLoadingAtom);
  const [, setError] = useAtom(userErrorAtom);

  // Track last known token to detect changes
  const lastTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const handleUserLoad = async () => {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

      // Detect logout: token was present, now it's gone
      if (lastTokenRef.current && !token) {
        setUser(null); // Clear cached user immediately
        setError(null);
        __clearOrderCache();
        lastTokenRef.current = null;
        return;
      }

      // No token, no user to load
      if (!token) {
        lastTokenRef.current = null;
        setIsLoading(false);
        return;
      }

      // Token changed (login) - refresh user data
      const tokenChanged = lastTokenRef.current !== token;
      const userNotLoaded = user === null;

      if (!tokenChanged && !userNotLoaded) {
        return; // Already loaded, token hasn't changed
      }

      lastTokenRef.current = token;

      try {
        setIsLoading(true);
        setError(null);

        const userData = await UserService.me();
        setUser(userData);
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Failed to fetch user");
        setError(err);
        const hasDetails =
          (error instanceof Error && error.message) ||
          (typeof error === "object" &&
            error !== null &&
            ((("status" in error && typeof (error as any).status === "number") ||
              ("message" in error && typeof (error as any).message === "string"))));
        if (hasDetails) {
          console.error("[AuthInitializer] Failed to load user:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Run on mount
    handleUserLoad();

    // Listen for storage changes (logout from other tabs, programmatic removal)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ACCESS_TOKEN_STORAGE_KEY) {
        handleUserLoad();
      }
    };

    const handleTokenEvent = () => {
      handleUserLoad();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(ACCESS_TOKEN_EVENT, handleTokenEvent);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(ACCESS_TOKEN_EVENT, handleTokenEvent);
    };
  }, [user, setUser, setIsLoading, setError]);

  return null; // This component doesn't render anything
}
