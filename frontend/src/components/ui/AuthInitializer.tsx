"use client";

import { useEffect } from "react";
import { useAtom } from "jotai";
import { currentUserAtom, userLoadingAtom, userErrorAtom } from "@/lib/atoms/auth";
import UserService from "@/services/user";

/**
 * AuthInitializer Component
 * Fetches the current user once at app startup and caches it globally
 * Prevents redundant API calls to /users/me endpoint
 *
 * This component should be placed in the root layout/provider
 */
export default function AuthInitializer() {
  const [user, setUser] = useAtom(currentUserAtom);
  const [isLoading, setIsLoading] = useAtom(userLoadingAtom);
  const [, setError] = useAtom(userErrorAtom);

  useEffect(() => {
    // If user already loaded, skip
    if (user !== null || isLoading) {
      return;
    }

    // Check if user is authenticated
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      return;
    }

    // Fetch user once
    const initializeUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const userData = await UserService.me();
        setUser(userData);
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Failed to fetch user");
        setError(err);
        console.error("[AuthInitializer] Failed to load user:", error);
        // Don't clear the user state on error - let components handle it
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []); // Empty dependency array - runs only once

  return null; // This component doesn't render anything
}
