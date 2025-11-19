"use client";

import { useAtomValue } from "jotai";
import { currentUserAtom, userErrorAtom, userLoadingAtom } from "@/lib/atoms/auth";

/**
 * Hook to access the globally cached authenticated user.
 * Relies on `AuthInitializer` to keep the cache fresh and synced with logout/login.
 */
export const useMe = () => {
  const data = useAtomValue(currentUserAtom);
  const isLoading = useAtomValue(userLoadingAtom);
  const error = useAtomValue(userErrorAtom);

  return { data, isLoading, error };
};
