"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { setNavigationInProgress } from "@/atoms/loading";
// removed unused import: useAtomValue from "jotai"

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastUrlRef = useRef<string>("");

  // Start on internal link clicks (event delegation)
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return;
      // Ignore modified clicks
      if (
        (e as any).metaKey ||
        (e as any).ctrlKey ||
        (e as any).shiftKey ||
        (e as any).altKey
      )
        return;
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

  // Stop immediately after URL changes
  useEffect(() => {
    const currentUrl = pathname + "?" + (searchParams?.toString() || "");
    if (currentUrl === lastUrlRef.current) return;
    lastUrlRef.current = currentUrl;

    setNavigationInProgress(false);
  }, [pathname, searchParams]);

  return null;
}
