"use client";

import { useAtom } from "jotai";
import { currentUserAtom, userLoadingAtom, userErrorAtom } from "@/lib/atoms/auth";

/**
 * Hook to access the globally cached current user
 * Prevents redundant API calls by using a shared Jotai atom
 *
 * Usage:
 * const { user, isLoading, error, isAuthenticated } = useCurrentUser();
 */
export const useCurrentUser = () => {
  const [user] = useAtom(currentUserAtom);
  const [isLoading] = useAtom(userLoadingAtom);
  const [error] = useAtom(userErrorAtom);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin ?? false,
    roleName: user?.roleName ?? null,
    isStoreManager: (user?.roleName ?? "").toLowerCase() === "store manager",
  };
};
