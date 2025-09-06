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
    const restore: { pushState?: History["pushState"]; replaceState?: History["replaceState"]; } = {};

    function clearFailSafe() {
      if (failSafeId) {
        try {
          clearTimeout(failSafeId);
        } catch {}
        failSafeId = undefined;
      }
    }

    function onClick(e: MouseEvent) {
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
      // Allow opting-out on specific links
      if (el.getAttribute("data-nav-ignore") === "true") return;
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

    // Also capture programmatic navigations (router.push/replace)
    try {
      restore.pushState = history.pushState.bind(history);
      restore.replaceState = history.replaceState.bind(history);
      history.pushState = function (
        ...args: Parameters<History["pushState"]>
      ) {
        // Only show loader for push navigations
        setNavigationInProgress(true);
        clearFailSafe();
        failSafeId = window.setTimeout(() => setNavigationInProgress(false), 2000);
        return restore.pushState!(...args);
      } as any;
      history.replaceState = function (
        ...args: Parameters<History["replaceState"]>
      ) {
        // Do not show loader for replaceState to avoid flicker from query updates (nuqs)
        return restore.replaceState!(...args);
      } as any;
    } catch {}

    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPopState);
      clearFailSafe();
      // restore history methods
      if (restore.pushState) history.pushState = restore.pushState;
      if (restore.replaceState) history.replaceState = restore.replaceState;
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
