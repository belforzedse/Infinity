"use client";

import { useEffect, useRef } from "react";
import { adjustPendingRequests } from "@/atoms/loading";
import { API_BASE_URL } from "@/constants/api";

export default function GlobalFetchInterceptor() {
  const recentInteraction = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let interactionTimer: number | undefined;

    const markInteraction = () => {
      recentInteraction.current = true;
      if (interactionTimer) {
        try {
          clearTimeout(interactionTimer);
        } catch {}
      }
      interactionTimer = window.setTimeout(() => {
        recentInteraction.current = false;
        interactionTimer = undefined;
      }, 1000);
    };
    window.addEventListener("pointerdown", markInteraction, true);
    window.addEventListener("keydown", markInteraction, true);
    const originalFetch = window.fetch;
    let apiOrigin: string | null = null;
    try {
      apiOrigin = new URL(API_BASE_URL).origin;
    } catch {
      apiOrigin = null;
    }

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
        const isPureStatic =
          /\.(png|jpg|jpeg|gif|svg|webp|ico|css|woff2?|map)$/i.test(
            url.pathname,
          );
        if (isPureStatic) {
          return originalFetch(input as any, init);
        }
        // Ignore Next.js internal and image proxy requests
        if (
          url.pathname.startsWith("/_next") ||
          url.pathname.startsWith("/_next/image") ||
          url.searchParams.has("_rsc") ||
          url.search.includes("__next")
        ) {
          return originalFetch(input as any, init);
        }

        // Only count API requests to our backend origin
        if (apiOrigin && url.origin !== apiOrigin) {
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

    window.fetch = wrappedFetch as any;
    return () => {
      // restore
      window.fetch = originalFetch;
      window.removeEventListener("pointerdown", markInteraction, true);
      window.removeEventListener("keydown", markInteraction, true);
      if (interactionTimer) {
        try {
          clearTimeout(interactionTimer);
        } catch {}
        interactionTimer = undefined;
      }
    };
  }, []);

  return null;
}
