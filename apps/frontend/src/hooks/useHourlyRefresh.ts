import { useEffect, useRef, useCallback } from "react";

/**
 * Hook to automatically refresh data every hour
 * Useful for product pages that need to show updated prices, stock, etc.
 *
 * The hook will:
 * - Call the provided refetch function every hour
 * - Only fetch when page is visible (respects tab visibility)
 * - Clean up intervals on unmount
 *
 * @param refetchFn - Function to call for data refresh
 * @param options - Configuration options
 */
export function useHourlyRefresh(
  refetchFn: () => void | Promise<void>,
  options?: {
    // Initial delay before first refresh (in ms, default: 1 hour)
    initialDelayMs?: number;
    // Interval between refreshes (in ms, default: 1 hour)
    intervalMs?: number;
    // Whether to refresh on component mount
    refreshOnMount?: boolean;
  }
) {
  const {
    initialDelayMs = 3600000, // 1 hour
    intervalMs = 3600000, // 1 hour
    refreshOnMount = false,
  } = options || {};

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPageVisibleRef = useRef(true);

  // Handle page visibility changes (don't fetch if tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    if (isPageVisibleRef.current) {
      try {
        await refetchFn();
      } catch (error) {
        console.error("Hourly refresh failed:", error);
        // Don't throw - just log the error to not interrupt the app
      }
    }
  }, [refetchFn]);

  // Set up hourly polling
  useEffect(() => {
    // Optionally refresh on mount
    if (refreshOnMount) {
      refresh();
    }

    // Set up interval after initial delay
    const timeoutId = setTimeout(() => {
      // First refresh
      refresh();

      // Then set up recurring interval
      intervalRef.current = setInterval(() => {
        refresh();
      }, intervalMs);
    }, initialDelayMs);

    return () => {
      clearTimeout(timeoutId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refresh, initialDelayMs, intervalMs, refreshOnMount]);

  return { refresh };
}

/**
 * Alternative hook for server-side rendered pages
 * Set the revalidate export in your Next.js page component:
 *
 * export const revalidate = 3600; // Revalidate every hour
 *
 * This is the recommended approach for SSR pages as it:
 * - Automatically regenerates the page on every request after 1 hour
 * - Reduces client-side processing
 * - Provides consistent data across all users
 */
