"use client";

import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { refreshTable } from "@/components/SuperAdmin/Table";

/**
 * Hook that refreshes data when account/user pages become visible after being in the background.
 *
 * Includes a moderate debounce (15 seconds) to ensure account data is reasonably fresh
 * while still preventing excessive API calls.
 *
 * Usage:
 * ```typescript
 * 'use client'
 * export default function OrdersPage() {
 *   useAccountFreshData();
 *   return <OrdersList />;
 * }
 * ```
 *
 * This hook:
 * - Triggers a refresh when the page tab becomes visible (switched back from another tab)
 * - Debounces visibility changes to prevent excessive API calls (15 second delay)
 * - Works with data refresh atoms/state management
 * - Intended for account-related pages: /account, /orders, /addresses, /wallet, /likes
 */
export function useAccountFreshData() {
  const [, setRefresh] = useAtom(refreshTable);
  const visibilityDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Refresh data when page becomes visible (switched back from another tab/window)
  // Debounced to prevent excessive API calls (15 second delay)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Clear existing debounce timer if any
        if (visibilityDebounceRef.current) {
          clearTimeout(visibilityDebounceRef.current);
        }

        // Debounce: wait 15 seconds before refreshing
        // This is for account pages where users need relatively fresh data
        // (orders, wallet balance, addresses, etc.)
        visibilityDebounceRef.current = setTimeout(() => {
          setRefresh(true);
          visibilityDebounceRef.current = null;
        }, 15000); // 15 seconds in milliseconds
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
