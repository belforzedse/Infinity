"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ANALYTICS_CONSENT_EVENT,
  getAnalyticsConsent,
  syncMatomoConsentState,
} from "@/lib/analytics/matomo";

const DEFAULT_MATOMO_URL = "https://analytics.infinitycolor.co";
const DEFAULT_MATOMO_SITE_ID = "1";

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function MatomoTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPathRef = useRef<string>("");

  const baseUrl = trimTrailingSlash(
    (process.env.NEXT_PUBLIC_MATOMO_URL || DEFAULT_MATOMO_URL).trim(),
  );
  const siteId = (process.env.NEXT_PUBLIC_MATOMO_SITE_ID || DEFAULT_MATOMO_SITE_ID).trim();
  const isConfigured = Boolean(baseUrl && siteId);

  const currentPath = useMemo(() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname || "/";
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!isConfigured || typeof window === "undefined") return;
    const win = window as Window & { _paq?: Array<[string, ...any[]]>; __matomoInitialized?: boolean };

    if (!win.__matomoInitialized) {
      win._paq = win._paq || [];
      // Matomo SPA pattern: initialize tracker once, then send page views on route changes.
      win._paq.push(["setTrackerUrl", `${baseUrl}/matomo.php`]);
      win._paq.push(["setSiteId", siteId]);
      win._paq.push(["enableLinkTracking"]);
      win._paq.push(["enableHeartBeatTimer"]);
      syncMatomoConsentState(getAnalyticsConsent());

      const selector = `script[data-matomo-site-id="${siteId}"]`;
      if (!document.querySelector(selector)) {
        const script = document.createElement("script");
        script.async = true;
        script.defer = true;
        script.src = `${baseUrl}/matomo.js`;
        script.setAttribute("data-matomo-site-id", siteId);
        document.head.appendChild(script);
      }

      win.__matomoInitialized = true;
    }
  }, [baseUrl, siteId, isConfigured]);

  useEffect(() => {
    if (!isConfigured || typeof window === "undefined") return;
    const queue = (window as Window & { _paq?: Array<[string, ...any[]]> })._paq;
    if (!queue) return;
    if (lastTrackedPathRef.current === currentPath) return;

    const absoluteUrl = `${window.location.origin}${currentPath}`;
    queue.push(["setCustomUrl", absoluteUrl]);
    queue.push(["setDocumentTitle", document.title]);
    queue.push(["trackPageView"]);
    lastTrackedPathRef.current = currentPath;
  }, [currentPath, isConfigured]);

  useEffect(() => {
    if (!isConfigured || typeof window === "undefined") return;
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ consent?: "granted" | "denied" }>;
      syncMatomoConsentState(custom.detail?.consent || getAnalyticsConsent());
    };
    window.addEventListener(ANALYTICS_CONSENT_EVENT, handler);
    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, handler);
    };
  }, [isConfigured]);

  return null;
}
