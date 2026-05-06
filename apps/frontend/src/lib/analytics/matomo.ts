"use client";

export const ANALYTICS_CONSENT_STORAGE_KEY = "analytics-consent";
export const ANALYTICS_CONSENT_EVENT = "analytics-consent-changed";
const ANALYTICS_ONCE_PREFIX = "analytics-once:";

export type AnalyticsConsent = "granted" | "denied" | null;
export type FunnelStep = "view_item" | "add_to_cart" | "begin_checkout" | "purchase";

type MatomoQueue = Array<[string, ...any[]]>;

function getQueue(): MatomoQueue | null {
  if (typeof window === "undefined") return null;
  const win = window as Window & { _paq?: MatomoQueue };
  win._paq = win._paq || [];
  return win._paq;
}

function dispatchConsentChanged(value: Exclude<AnalyticsConsent, null>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(ANALYTICS_CONSENT_EVENT, {
      detail: { consent: value },
    }),
  );
}

function normalizeNumber(value?: number | string): number | undefined {
  if (value === undefined || value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
  if (value === "granted" || value === "denied") return value;
  return null;
}

export function setAnalyticsConsent(value: Exclude<AnalyticsConsent, null>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, value);
  dispatchConsentChanged(value);
}

function shouldSkipOnce(onceKey?: string): boolean {
  if (!onceKey || typeof window === "undefined") return false;
  const key = `${ANALYTICS_ONCE_PREFIX}${onceKey}`;
  if (sessionStorage.getItem(key) === "1") return true;
  sessionStorage.setItem(key, "1");
  return false;
}

export function syncMatomoConsentState(consent: AnalyticsConsent) {
  const queue = getQueue();
  if (!queue) return;

  // Track cookieless by default and enrich tracking only after explicit consent.
  queue.push(["requireCookieConsent"]);
  if (consent === "granted") {
    queue.push(["rememberCookieConsentGiven"]);
  } else {
    queue.push(["forgetCookieConsentGiven"]);
  }
}

export function trackMatomoEvent(params: {
  category: string;
  action: string;
  name?: string;
  value?: number;
  onceKey?: string;
}) {
  if (shouldSkipOnce(params.onceKey)) return;
  const queue = getQueue();
  if (!queue) return;
  const normalizedValue = normalizeNumber(params.value);
  queue.push([
    "trackEvent",
    params.category,
    params.action,
    params.name,
    normalizedValue,
  ]);
}

export function trackFunnelStep(
  step: FunnelStep,
  options?: { label?: string; value?: number; onceKey?: string },
) {
  trackMatomoEvent({
    category: "funnel",
    action: step,
    name: options?.label,
    value: options?.value,
    onceKey: options?.onceKey,
  });
}

export function trackSearch(query: string, source: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  trackMatomoEvent({
    category: "search",
    action: "search",
    name: `${source}:${trimmed}`,
  });
}
