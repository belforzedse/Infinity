"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { navigationInProgressAtom, setNavigationInProgress } from "@/atoms/loading";
import { useAtomValue } from "jotai";

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inProgress = useAtomValue(navigationInProgressAtom);
  const lastUrlRef = useRef<string>("");
  const hideTimer = useRef<any>(null);

  // Start on internal link clicks (event delegation)
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return;
      // Ignore modified clicks
      if ((e as any).metaKey || (e as any).ctrlKey || (e as any).shiftKey || (e as any).altKey) return;
      const el = (e.target as HTMLElement)?.closest?.("a");
      if (!el) return;
      const href = el.getAttribute("href");
      const target = el.getAttribute("target");
      if (!href || href.startsWith("#") || target === "_blank") return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        // Same-origin navigation likely via Next Link
        setNavigationInProgress(true);
      } catch {
        // ignore
      }
    }
    function onPopState() {
      setNavigationInProgress(true);
    }
    window.addEventListener("click", onClick, { capture: true });
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("click", onClick, { capture: true } as any);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  // Stop after URL change settles
  useEffect(() => {
    const currentUrl = pathname + "?" + (searchParams?.toString() || "");
    if (currentUrl === lastUrlRef.current) return;
    lastUrlRef.current = currentUrl;

    // Ensure the bar shows briefly to avoid flicker
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setNavigationInProgress(false), 500);
  }, [pathname, searchParams]);

  return null;
}
