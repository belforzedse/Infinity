"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAtomValue } from "jotai";
import { currentUserAtom } from "@/lib/atoms/auth";
import {
  ANALYTICS_CONSENT_EVENT,
  CUSTOM_DIMENSIONS,
  getAnalyticsConsent,
  isAnalyticsEnabled,
  resetAnalyticsUserId,
  setAnalyticsUserId,
  syncMatomoConsentState,
  trackPageView,
} from "@/lib/analytics/matomo";

const DEFAULT_MATOMO_URL = "https://analytics.infinitycolor.co";
const DEFAULT_MATOMO_SITE_ID = "1";

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

/**
 * Derive a stable, low-cardinality page type from the pathname. Used as an
 * action-scoped custom dimension so reports can segment by surface without us
 * tracking the full (high-cardinality) URL as a dimension.
 */
function derivePageType(pathname: string): string {
  if (!pathname || pathname === "/") return "home";
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0]?.toLowerCase() ?? "";
  if (first === "pdp") return "pdp";
  if (first === "plp" || first === "categories") return "plp";
  if (first === "search") return "search";
  if (first === "cart") return "cart";
  if (first === "checkout") return "checkout";
  if (first === "orders") return "orders";
  if (first === "blog") return "blog";
  if (first === "account" || first === "addresses" || first === "wallet" || first === "likes")
    return "account";
  if (first === "super-admin") return "admin";
  return "other";
}

export function MatomoTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUser = useAtomValue(currentUserAtom);
  const lastTrackedPathRef = useRef<string>("");
  const previousUrlRef = useRef<string>("");

  const baseUrl = trimTrailingSlash(
    (process.env.NEXT_PUBLIC_MATOMO_URL || DEFAULT_MATOMO_URL).trim(),
  );
  const siteId = (process.env.NEXT_PUBLIC_MATOMO_SITE_ID || DEFAULT_MATOMO_SITE_ID).trim();
  const enabled = isAnalyticsEnabled() && Boolean(baseUrl && siteId);

  const currentPath = useMemo(() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname || "/";
  }, [pathname, searchParams]);

  // 1) One-time tracker bootstrap + script injection.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const win = window as Window & {
      _paq?: Array<[string, ...any[]]>;
      __matomoInitialized?: boolean;
    };

    if (win.__matomoInitialized) return;
    win._paq = win._paq || [];
    // Matomo SPA pattern: configure the tracker once; route changes send the
    // page views explicitly (we never push trackPageView here, so the initial
    // view is owned solely by the navigation effect below — no double count).
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
  }, [baseUrl, siteId, enabled]);

  // 2) Send exactly one page view per real navigation, after the new route's
  //    metadata (document.title) has been committed and painted.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (lastTrackedPathRef.current === currentPath) return;

    const absoluteUrl = `${window.location.origin}${currentPath}`;
    const referrerUrl = previousUrlRef.current || document.referrer || undefined;
    const pageType = derivePageType(pathname || "/");

    // Defer to the next frame(s) so Next.js App Router has swapped in the new
    // <title> from page metadata before we read document.title. Without this the
    // pageview would carry the *previous* page's title.
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        const win = window as Window & { _paq?: Array<[string, ...any[]]> };
        if (!win._paq) return;
        win._paq.push(["setCustomDimension", CUSTOM_DIMENSIONS.pageType, pageType]);
        trackPageView({
          url: absoluteUrl,
          title: document.title,
          referrerUrl,
        });
        previousUrlRef.current = absoluteUrl;
      });
    });

    lastTrackedPathRef.current = currentPath;

    return () => {
      window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, [currentPath, pathname, enabled]);

  // 3) Keep Matomo's consent state in sync with banner changes.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ consent?: "granted" | "denied" }>;
      syncMatomoConsentState(custom.detail?.consent || getAnalyticsConsent());
    };
    window.addEventListener(ANALYTICS_CONSENT_EVENT, handler);
    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, handler);
    };
  }, [enabled]);

  // 4) User identity lifecycle — opaque internal id only, reset on logout.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const win = window as Window & { _paq?: Array<[string, ...any[]]> };
    if (!win._paq) return;
    const userId = (currentUser as { id?: number | string } | null)?.id;
    if (userId) {
      win._paq.push(["setCustomDimension", CUSTOM_DIMENSIONS.authStatus, "authenticated"]);
      setAnalyticsUserId(userId);
    } else {
      win._paq.push(["setCustomDimension", CUSTOM_DIMENSIONS.authStatus, "anonymous"]);
      resetAnalyticsUserId();
    }
  }, [currentUser, enabled]);

  return null;
}
