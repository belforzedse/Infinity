"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  showDelayMs?: number;
  minVisibleMs?: number;
};

export function useSmoothLoading(
  loading: boolean,
  { showDelayMs = 400, minVisibleMs = 100 }: Options = {},
) {
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const visibleSince = useRef<number | null>(null);

  useEffect(() => {
    function clearTimer(id: number | null) {
      if (id != null) clearTimeout(id);
    }

    if (loading) {
      clearTimer(hideTimer.current);
      hideTimer.current = null;
      if (!visible) {
        clearTimer(showTimer.current);
        showTimer.current = window.setTimeout(() => {
          visibleSince.current = Date.now();
          setVisible(true);
        }, showDelayMs);
      }
    } else {
      clearTimer(showTimer.current);
      showTimer.current = null;
      if (visible) {
        const since = visibleSince.current ?? Date.now();
        const remaining = Math.max(0, minVisibleMs - (Date.now() - since));
        clearTimer(hideTimer.current);
        hideTimer.current = window.setTimeout(() => {
          visibleSince.current = null;
          setVisible(false);
        }, remaining);
      }
    }
  }, [loading, showDelayMs, minVisibleMs, visible]);

  return visible;
}
