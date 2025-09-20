"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { setNavigationInProgress } from "@/atoms/loading";

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastUrlRef = useRef<string>("");
  const failSafeRef = useRef<number | null>(null);

  const clearFailSafe = useCallback(() => {
    if (failSafeRef.current) {
      try {
        clearTimeout(failSafeRef.current);
      } catch {}
      failSafeRef.current = null;
    }
  }, []);

  const startFailSafe = useCallback(() => {
    clearFailSafe();
    failSafeRef.current = window.setTimeout(
      () => setNavigationInProgress(false),
      2000,
    );
  }, [clearFailSafe]);

  // Start on internal link clicks (event delegation)
  useEffect(() => {
    const restore: {
      pushState?: History["pushState"];
      replaceState?: History["replaceState"];
      router?: any;
      routerPush?: (...args: any[]) => any;
      routerReplace?: (...args: any[]) => any;
      navigationListener?: (e: any) => void;
    } = {};

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

        // Start immediately so overlay appears before router acts
        setNavigationInProgress(true);
        startFailSafe();

        // Revert if another handler cancels the navigation
        queueMicrotask(() => {
          if (e.defaultPrevented) {
            setNavigationInProgress(false);
            clearFailSafe();
          }
        });
      } catch {
        // ignore
      }
    }

    function onPopState() {
      setNavigationInProgress(true);
      startFailSafe();
    }

    // Capture phase so we run before Next's internal link handler
    window.addEventListener("click", onClick, true);

    window.addEventListener("popstate", onPopState);

    // Start when navigation API is used (router.push, etc.)
    if ("navigation" in window) {
      const onNavigate = (e: any) => {
        try {
          const current = new URL(window.location.href);
          const destinationUrl = e.destination?.url;
          if (!destinationUrl) return;
          const url = new URL(destinationUrl, current.href);
          if (url.origin !== current.origin) return;
          const next = url.pathname + (url.search || "");
          const cur = current.pathname + (current.search || "");
          if (next === cur) return;
          setNavigationInProgress(true);
          startFailSafe();
        } catch {}
      };
      (window as any).navigation.addEventListener("navigate", onNavigate);
      restore.navigationListener = onNavigate;
    }

    // Also capture programmatic navigations (history/router.push)
    try {
      restore.pushState = history.pushState.bind(history);
      restore.replaceState = history.replaceState.bind(history);
      history.pushState = function (...args: Parameters<History["pushState"]>) {
        // Only show loader for push navigations
        setNavigationInProgress(true);
        startFailSafe();
        return restore.pushState!(...args);
      } as any;
      history.replaceState = function (
        ...args: Parameters<History["replaceState"]>
      ) {
        // Do not show loader for replaceState to avoid flicker from query updates (nuqs)
        return restore.replaceState!(...args);
      } as any;

      const nextRouter: any = (window as any).next?.router;
      if (nextRouter?.push) {
        restore.router = nextRouter;
        restore.routerPush = nextRouter.push.bind(nextRouter);
        nextRouter.push = (...args: any[]) => {
          setNavigationInProgress(true);
          startFailSafe();
          return restore.routerPush!(...args);
        };
      }
      if (nextRouter?.replace) {
        restore.router = nextRouter;
        restore.routerReplace = nextRouter.replace.bind(nextRouter);
        nextRouter.replace = (...args: any[]) => {
          setNavigationInProgress(true);
          startFailSafe();
          return restore.routerReplace!(...args);
        };
      }
    } catch {}

    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      clearFailSafe();
      // restore history methods
      if (restore.pushState) history.pushState = restore.pushState;
      if (restore.replaceState) history.replaceState = restore.replaceState;
      if (restore.navigationListener && "navigation" in window)
        (window as any).navigation.removeEventListener(
          "navigate",
          restore.navigationListener,
        );
      if (restore.router && restore.routerPush)
        restore.router.push = restore.routerPush;
      if (restore.router && restore.routerReplace)
        restore.router.replace = restore.routerReplace;
    };
  }, [clearFailSafe, startFailSafe]);

  // Stop immediately after URL changes
  useEffect(() => {
    const currentUrl = pathname + "?" + (searchParams?.toString() || "");
    if (currentUrl === lastUrlRef.current) return;
    lastUrlRef.current = currentUrl;

    setNavigationInProgress(false);
    clearFailSafe();
  }, [pathname, searchParams, clearFailSafe]);

  return null;
}
