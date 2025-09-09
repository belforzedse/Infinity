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
    let failSafeId: number | undefined;

    function clearFailSafe() {
      if (failSafeId) {
        try {
          clearTimeout(failSafeId);
        } catch {}
        failSafeId = undefined;
      }
    }

    function onClick(e: MouseEvent) {
      // If another handler prevented default (e.g., opens a modal), skip
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
        const current = new URL(window.location.href);
        const url = new URL(href, current.href);
        if (url.origin !== current.origin) return;
        // If clicking a link to the same URL (no real navigation), skip
        const nextPathAndQuery = url.pathname + (url.search || "");
        const currentPathAndQuery = current.pathname + (current.search || "");
        if (nextPathAndQuery === currentPathAndQuery) return;

        // Same-origin navigation likely via Next Link
        setNavigationInProgress(true);
        // Failsafe: if URL doesn't change (edge cases), clear after short delay
        clearFailSafe();
        failSafeId = window.setTimeout(() => setNavigationInProgress(false), 2000);
      } catch {
        // ignore
      }
    }
    function onPopState() {
      setNavigationInProgress(true);
      // Failsafe for popstate as well
      if (typeof window !== "undefined") {
        window.setTimeout(() => setNavigationInProgress(false), 2000);
      }
    }
    // Use bubble phase so e.defaultPrevented reflects user handlers
    window.addEventListener("click", onClick);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPopState);
      clearFailSafe();
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
