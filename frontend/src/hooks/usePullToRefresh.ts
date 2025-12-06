/**
 * Pull-to-Refresh Hook
 * Provides native-like pull-to-refresh functionality for mobile
 */

import { useEffect, useRef, useState } from "react";
import { hapticButton } from "@/utils/haptics";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
  threshold?: number; // Distance in pixels to trigger refresh
  resistance?: number; // Resistance factor (0-1) for pull distance
}

export function usePullToRefresh({
  onRefresh,
  enabled = true,
  threshold = 80,
  resistance = 0.5,
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number | null>(null);
  const isPulling = useRef(false);
  const elementRef = useRef<HTMLElement | null>(null);

  // Use refs to access current state values without including them in dependencies
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    pullDistanceRef.current = pullDistance;
  }, [pullDistance]);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || window.innerWidth >= 768) return;

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      // Only trigger if at the top of scrollable container
      if (window.scrollY === 0 && target) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || startY.current === null) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY.current;

      // Only allow downward pull
      if (deltaY > 0 && window.scrollY === 0) {
        e.preventDefault();
        const distance = deltaY * resistance;
        const newDistance = Math.min(distance, threshold * 1.5);
        pullDistanceRef.current = newDistance;
        setPullDistance(newDistance);
      } else {
        isPulling.current = false;
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current || startY.current === null) return;

      isPulling.current = false;
      startY.current = null;

      // Use ref values to avoid stale closures
      const currentPullDistance = pullDistanceRef.current;
      const currentlyRefreshing = isRefreshingRef.current;

      if (currentPullDistance >= threshold && !currentlyRefreshing) {
        hapticButton();
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        pullDistanceRef.current = 0;
        setPullDistance(0);
        try {
          await onRefresh();
        } finally {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
        }
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, onRefresh, threshold, resistance]);

  return {
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1),
  };
}

