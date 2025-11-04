"use client";

import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { refreshTable } from "@/components/SuperAdmin/Table";

/**
 * Hook that refreshes data when a normal page becomes visible after being in the background.
 *
 * Includes a long debounce (10 minutes) to prevent excessive API calls while still ensuring
 * reasonably fresh data when users return to the page.
 *
 * Usage:
 * ```typescript
 * 'use client'
 * export default function ProductPage() {
 *   useFreshDataOnVisibility();
 *   return <ProductDetail />;
 * }
 * ```
 *
 * This hook:
 * - Triggers a refresh when the page tab becomes visible (switched back from another tab)
 * - Debounces visibility changes to prevent excessive API calls (10 minute delay)
 * - Works with data refresh atoms/state management
 */
export function useFreshDataOnVisibility() {
  const [, setRefresh] = useAtom(refreshTable);
  const visibilityDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Refresh data when page becomes visible (switched back from another tab/window)
  // Debounced to prevent excessive API calls (10 minute delay)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Clear existing debounce timer if any
        if (visibilityDebounceRef.current) {
          clearTimeout(visibilityDebounceRef.current);
        }

        // Debounce: wait 10 minutes before refreshing to avoid excessive calls
        // This is for normal pages where data changes less frequently
        visibilityDebounceRef.current = setTimeout(() => {
          setRefresh(true);
          visibilityDebounceRef.current = null;
        }, 600000); // 10 minutes in milliseconds
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
