"use client";

import { useEffect, useRef, useState } from "react";

type UseMobileStickyHeaderOptions = {
  breakpointPx?: number;
  nearTopScrollY?: number;
  scrolledScrollY?: number;
};

export function useMobileStickyHeader({
  breakpointPx = 1024,
  nearTopScrollY = 80,
  scrolledScrollY = 8,
}: UseMobileStickyHeaderOptions = {}) {
  const [showHeader, setShowHeader] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > scrolledScrollY);

      if (window.innerWidth >= breakpointPx) {
        lastScrollY.current = currentY;
        setShowHeader(true);
        return;
      }

      const isScrollingUp = currentY <= lastScrollY.current;
      const nearTop = currentY < nearTopScrollY;
      setShowHeader(isScrollingUp || nearTop);
      lastScrollY.current = Math.max(0, currentY);
    };

    const frame = window.requestAnimationFrame(handleScroll);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [breakpointPx, nearTopScrollY, scrolledScrollY]);

  return { scrolled, showHeader };
}
