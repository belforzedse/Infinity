"use client";

import { useEffect } from "react";
import { adjustPendingRequests } from "@/atoms/loading";

export default function GlobalFetchInterceptor() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const originalFetch = window.fetch;

    async function wrappedFetch(input: RequestInfo | URL, init?: RequestInit) {
      // Ignore static asset and Next internal data prefetch requests
      try {
        const raw =
          typeof input === "string" ? input : (input as any).url || "";
        const url = new URL(raw, window.location.href);
        const isStatic =
          /\.(png|jpg|jpeg|gif|svg|webp|ico|css|woff2?|map)$/i.test(
            url.pathname,
          );
        const isNextInternal =
          url.pathname.startsWith("/_next") ||
          url.searchParams.has("_rsc") ||
          url.search.includes("__next");
        if (isStatic || isNextInternal) {
          return originalFetch(input as any, init);
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

    // @ts-ignore override
    window.fetch = wrappedFetch as any;
    return () => {
      // restore
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
