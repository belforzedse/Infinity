"use client";

/**
 * Centralized, typed Matomo analytics layer.
 *
 * All `_paq` interaction lives here — components must never push to the queue
 * directly. Every method is safe to call before the tracker script has loaded
 * (Matomo replays the queued commands once `matomo.js` is ready) and is a no-op
 * during SSR or when analytics is disabled for the current environment.
 *
 * The canonical event taxonomy is documented in
 * `apps/frontend/docs/matomo-event-taxonomy.md`. Keep the two in sync.
 */

export const ANALYTICS_CONSENT_STORAGE_KEY = "analytics-consent";
export const ANALYTICS_CONSENT_EVENT = "analytics-consent-changed";
const ANALYTICS_ONCE_PREFIX = "analytics-once:";

export type AnalyticsConsent = "granted" | "denied" | null;
export type FunnelStep = "view_item" | "add_to_cart" | "begin_checkout" | "purchase";

/**
 * Action-scoped (per pageview/action) and visit-scoped custom dimension slots.
 * The numeric IDs MUST match the dimensions configured in the Matomo admin UI.
 * Keep this list short and low-cardinality (see <custom_dimensions>). IDs are
 * intentionally centralized so we never scatter magic numbers across the app.
 */
export const CUSTOM_DIMENSIONS = {
  /** visit-scoped: "authenticated" | "anonymous" */
  authStatus: 1,
  /** action-scoped: page type, e.g. "home" | "plp" | "pdp" | "cart" | "checkout" */
  pageType: 2,
  /** action-scoped: stable product id on PDP */
  productId: 3,
  /** action-scoped: stable category id on PLP/category pages */
  categoryId: 4,
} as const;

export type CustomDimensionKey = keyof typeof CUSTOM_DIMENSIONS;

type MatomoQueue = Array<[string, ...any[]]>;

/**
 * Analytics is disabled by default outside production so local development and
 * automated tests never pollute the live Matomo site. Set
 * `NEXT_PUBLIC_MATOMO_ENABLE_DEV=true` to opt in while debugging tracking.
 */
export function isAnalyticsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_MATOMO_ENABLE_DEV === "true") return true;
  return process.env.NODE_ENV === "production";
}

function getQueue(): MatomoQueue | null {
  if (typeof window === "undefined") return null;
  const win = window as Window & { _paq?: MatomoQueue };
  win._paq = win._paq || [];
  return win._paq;
}

/** Push a command onto the Matomo queue. No-ops when analytics is disabled. */
function push(command: [string, ...any[]]): void {
  if (!isAnalyticsEnabled()) return;
  const queue = getQueue();
  if (!queue) return;
  queue.push(command);
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

/**
 * Strip values that look like PII so they never reach Matomo. Used for free-text
 * inputs such as site-search keywords. Returns null when the value should be
 * dropped entirely.
 */
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const LONG_DIGIT_RE = /\d{7,}/; // phone numbers, card fragments, order tokens

export function sanitizeFreeText(value: string, maxLength = 120): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (EMAIL_RE.test(trimmed) || LONG_DIGIT_RE.test(trimmed)) return null;
  return trimmed.slice(0, maxLength);
}

// ---------------------------------------------------------------------------
// Consent lifecycle
// ---------------------------------------------------------------------------

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

/**
 * Reconcile Matomo's cookie-consent state with the stored preference.
 * We always require cookie consent (cookieless tracking by default) and only
 * remember cookies after an explicit grant.
 */
export function syncMatomoConsentState(consent: AnalyticsConsent) {
  if (!isAnalyticsEnabled()) return;
  const queue = getQueue();
  if (!queue) return;

  queue.push(["requireCookieConsent"]);
  if (consent === "granted") {
    queue.push(["rememberCookieConsentGiven"]);
  } else {
    queue.push(["forgetCookieConsentGiven"]);
  }
}

// ---------------------------------------------------------------------------
// `once` guard — prevents duplicate tracking from re-renders / Strict Mode.
// ---------------------------------------------------------------------------

function shouldSkipOnce(onceKey?: string): boolean {
  if (!onceKey || typeof window === "undefined") return false;
  const key = `${ANALYTICS_ONCE_PREFIX}${onceKey}`;
  if (sessionStorage.getItem(key) === "1") return true;
  sessionStorage.setItem(key, "1");
  return false;
}

// ---------------------------------------------------------------------------
// Pageviews (used by MatomoTracker)
// ---------------------------------------------------------------------------

export function trackPageView(options: {
  url: string;
  title?: string;
  referrerUrl?: string;
}): void {
  if (!isAnalyticsEnabled()) return;
  const queue = getQueue();
  if (!queue) return;

  if (options.referrerUrl) {
    queue.push(["setReferrerUrl", options.referrerUrl]);
  }
  queue.push(["setCustomUrl", options.url]);
  if (options.title) {
    queue.push(["setDocumentTitle", options.title]);
  }
  queue.push(["trackPageView"]);
  // Re-scan the new DOM for outbound/download links after an SPA navigation.
  queue.push(["enableLinkTracking"]);
}

// ---------------------------------------------------------------------------
// Custom dimensions
// ---------------------------------------------------------------------------

export function setCustomDimension(key: CustomDimensionKey, value: string | number): void {
  const id = CUSTOM_DIMENSIONS[key];
  push(["setCustomDimension", id, String(value)]);
}

export function deleteCustomDimension(key: CustomDimensionKey): void {
  const id = CUSTOM_DIMENSIONS[key];
  push(["deleteCustomDimension", id]);
}

// ---------------------------------------------------------------------------
// Events / goals
// ---------------------------------------------------------------------------

export function trackMatomoEvent(params: {
  category: string;
  action: string;
  name?: string;
  value?: number;
  onceKey?: string;
}) {
  if (shouldSkipOnce(params.onceKey)) return;
  push([
    "trackEvent",
    params.category,
    params.action,
    params.name,
    normalizeNumber(params.value),
  ]);
}

export function trackGoal(idGoal: number, value?: number): void {
  push(["trackGoal", idGoal, normalizeNumber(value)]);
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

// ---------------------------------------------------------------------------
// Site search (native Matomo report — NOT a generic event)
// ---------------------------------------------------------------------------

/**
 * Record a site search using Matomo's native Site Search tracking so it appears
 * under Behaviour → Site Search (keywords, no-result keywords, search → page
 * follow-through) instead of being buried in generic events.
 *
 * `category` is the search surface (e.g. "desktop", "mobile"). `resultsCount`
 * powers the zero-result report — pass it whenever the count is known, or leave
 * it undefined to let Matomo treat the result count as unknown.
 */
export function trackSiteSearch(
  keyword: string,
  category?: string,
  resultsCount?: number,
): void {
  const safe = sanitizeFreeText(keyword);
  if (!safe) return;
  push(["trackSiteSearch", safe, category ?? false, normalizeNumber(resultsCount) ?? false]);
}

/**
 * Backward-compatible wrapper kept for existing call sites. `source` is mapped
 * to the Matomo search category and an optional `resultsCount` enables the
 * zero-result report.
 */
export function trackSearch(query: string, source: string, resultsCount?: number) {
  trackSiteSearch(query, source, resultsCount);
}

// ---------------------------------------------------------------------------
// Content tracking (impressions / interactions)
// ---------------------------------------------------------------------------

export function trackContentImpression(contentName: string, contentPiece?: string, target?: string) {
  push(["trackContentImpression", contentName, contentPiece, target]);
}

export function trackContentInteraction(
  contentInteraction: string,
  contentName: string,
  contentPiece?: string,
  target?: string,
) {
  push(["trackContentInteraction", contentInteraction, contentName, contentPiece, target]);
}

// ---------------------------------------------------------------------------
// User identity lifecycle
// ---------------------------------------------------------------------------

/**
 * Associate the visit with an opaque, stable internal id. Never pass an email,
 * phone number, or any other personal identifier (see <privacy_and_security>).
 */
export function setAnalyticsUserId(userId: string | number): void {
  const id = String(userId).trim();
  if (!id) return;
  push(["setUserId", id]);
}

/** Clear the user id on logout and reset the visitor so sessions don't bleed. */
export function resetAnalyticsUserId(): void {
  push(["resetUserId"]);
  // A new visit must be started so the now-anonymous actions are not attributed
  // to the previous user's visit.
  push(["appendToTrackingUrl", "new_visit=1"]);
}
