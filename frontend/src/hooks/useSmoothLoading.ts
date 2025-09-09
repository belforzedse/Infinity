"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  // Delay before showing to avoid flicker on ultra-fast requests
  showDelayMs?: number;
  // Minimum time to remain visible once shown
  minVisibleMs?: number;
};

/**
 * Smooths a boolean loading signal so the UI remains perceptible.
 * - Adds a short delay before showing
 * - Ensures a minimum visible time once shown
 */
export default function useSmoothLoading(
  loading: boolean,
  { showDelayMs = 120, minVisibleMs = 300 }: Options = {},
) {
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const visibleSince = useRef<number | null>(null);

  useEffect(() => {
    function clearTimer(id: number | null) {
      if (id != null) {
        try {
          clearTimeout(id);
        } catch {}
      }
    }

    if (loading) {
      // Cancel any pending hide
      clearTimer(hideTimer.current);
      hideTimer.current = null;

      if (!visible) {
        // Schedule show with a tiny delay
        clearTimer(showTimer.current);
        showTimer.current = window.setTimeout(() => {
          visibleSince.current = Date.now();
          setVisible(true);
        }, showDelayMs);
      }
    } else {
      // Not loading: compute if we need to keep visible to respect min duration
      clearTimer(showTimer.current);
      showTimer.current = null;

      if (visible) {
        const since = visibleSince.current ?? Date.now();
        const elapsed = Date.now() - since;
        const remaining = Math.max(0, minVisibleMs - elapsed);
        clearTimer(hideTimer.current);
        hideTimer.current = window.setTimeout(() => {
          visibleSince.current = null;
          setVisible(false);
        }, remaining);
      } else {
        // Ensure fully hidden if we never showed
        setVisible(false);
      }
    }

    return () => {
      // cleanup on unmount or change
      // Note: we intentionally don't force-set state here
    };
  }, [loading, showDelayMs, minVisibleMs, visible]);

  return visible;
}

