"use client";

import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { refreshTable } from "@/components/SuperAdmin/Table";

/**
 * Hook that ensures fresh data is loaded when a super-admin page is entered
 * or when the page becomes visible after being in the background.
 *
 * Includes debouncing to prevent excessive API calls if tabs are rapidly switched.
 *
 * Usage:
 * ```typescript
 * export default function MyAdminPage() {
 *   useFreshDataOnPageLoad();
 *   return <SuperAdminTable url="..." columns={...} />;
 * }
 * ```
 *
 * This hook:
 * - Triggers a refresh when the component mounts (page entered)
 * - Triggers a refresh when the page tab becomes visible (switched back from another tab)
 * - Debounces visibility changes to prevent excessive API calls (10s delay)
 * - Works with SuperAdminTable which listens to the refreshTable atom
 */
export function useFreshDataOnPageLoad() {
  const [, setRefresh] = useAtom(refreshTable);
  const visibilityDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Refresh data when page first loads
  useEffect(() => {
    setRefresh(true);
  }, [setRefresh]);

  // Refresh data when page becomes visible (switched back from another tab/window)
  // Debounced to prevent excessive API calls if tabs are rapidly switched
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Clear existing debounce timer if any
        if (visibilityDebounceRef.current) {
          clearTimeout(visibilityDebounceRef.current);
        }

        // Debounce: wait 10 seconds before refreshing to avoid excessive calls
        // This prevents issues when rapidly switching between tabs
        visibilityDebounceRef.current = setTimeout(() => {
          setRefresh(true);
          visibilityDebounceRef.current = null;
        }, 10000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (visibilityDebounceRef.current) {
        clearTimeout(visibilityDebounceRef.current);
      }
    };
  }, [setRefresh]);
}
