"use client";

import { useEffect } from "react";
import { adjustPendingRequests, navigationInProgressAtom } from "@/atoms/loading";
import jotaiStore from "@/lib/jotaiStore";

export default function GlobalFetchInterceptor() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const originalFetch = window.fetch;

    async function wrappedFetch(input: RequestInfo | URL, init?: RequestInit) {
      // Count all non-trivial network work, but ignore pure static assets like images/fonts/css
      try {
        const raw =
          typeof input === "string" ? input : (input as any).url || "";
        const url = new URL(raw, window.location.href);
        const method = (
          init?.method ||
          (typeof input !== "string" && (input as any).method) ||
          "GET"
        ).toUpperCase();
        // Ignore preflight/HEAD requests
        if (method === "OPTIONS" || method === "HEAD") {
          return originalFetch(input as any, init);
        }
        const isPureStatic = /\.(png|jpg|jpeg|gif|svg|webp|ico|css|woff2?|map)$/i.test(
          url.pathname,
        );
        if (isPureStatic) {
          return originalFetch(input as any, init);
        }
        const isNextInternal =
          url.pathname.startsWith("/_next") ||
          url.searchParams.has("_rsc") ||
          url.search.includes("__next");
        if (isNextInternal) {
          // Count these only during actual navigations to avoid overlay flicker on prefetch
          const navActive = jotaiStore.get(navigationInProgressAtom);
          if (!navActive) {
            return originalFetch(input as any, init);
          }
        }
      } catch {}

      adjustPendingRequests(1);
      try {
        const res = await originalFetch(input as any, init);
        return res;
      } finally {
        adjustPendingRequests(-1);
      }
    }

    // @ts-expect-error overriding global fetch for loading instrumentation
    window.fetch = wrappedFetch as any;
    return () => {
      // restore
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
