/**
 * Tests for the centralized Matomo analytics layer. Analytics is disabled
 * outside production, so we opt in via NEXT_PUBLIC_MATOMO_ENABLE_DEV for these
 * tests and assert the exact `_paq` commands produced.
 */

declare global {
  // eslint-disable-next-line no-var
  var _paq: Array<[string, ...any[]]> | undefined;
}

function getPaq(): Array<[string, ...any[]]> {
  return (window as any)._paq || [];
}

describe("lib/analytics/matomo", () => {
  beforeEach(() => {
    jest.resetModules();
    (window as any)._paq = [];
    window.sessionStorage.clear();
    window.localStorage.clear();
    process.env.NEXT_PUBLIC_MATOMO_ENABLE_DEV = "true";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_MATOMO_ENABLE_DEV;
  });

  it("isAnalyticsEnabled honors environment gating", async () => {
    const mod = await import("../matomo");
    expect(mod.isAnalyticsEnabled()).toBe(true);

    process.env.NEXT_PUBLIC_MATOMO_ENABLE_DEV = "false";
    // NODE_ENV is "test" under jest, so analytics must be disabled.
    expect(mod.isAnalyticsEnabled()).toBe(false);
  });

  it("does not push when analytics is disabled", async () => {
    process.env.NEXT_PUBLIC_MATOMO_ENABLE_DEV = "false";
    const mod = await import("../matomo");
    mod.trackMatomoEvent({ category: "engagement", action: "click_add_to_cart" });
    expect(getPaq()).toHaveLength(0);
  });

  it("sanitizeFreeText drops PII and caps length", async () => {
    const mod = await import("../matomo");
    expect(mod.sanitizeFreeText("hello world")).toBe("hello world");
    expect(mod.sanitizeFreeText("  spaced  ")).toBe("spaced");
    expect(mod.sanitizeFreeText("user@example.com")).toBeNull();
    expect(mod.sanitizeFreeText("call 09123456789")).toBeNull(); // 7+ digit run
    expect(mod.sanitizeFreeText("")).toBeNull();
    expect(mod.sanitizeFreeText("x".repeat(200))?.length).toBe(120);
  });

  it("trackSiteSearch uses native trackSiteSearch and drops PII keywords", async () => {
    const mod = await import("../matomo");
    mod.trackSiteSearch("red shoes", "plp", 12);
    mod.trackSiteSearch("buyer@example.com", "plp", 0); // PII -> dropped
    const calls = getPaq();
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual(["trackSiteSearch", "red shoes", "plp", 12]);
  });

  it("trackSearch is a backward-compatible alias for native site search", async () => {
    const mod = await import("../matomo");
    mod.trackSearch("boots", "desktop");
    const calls = getPaq();
    expect(calls[0][0]).toBe("trackSiteSearch");
    expect(calls[0][1]).toBe("boots");
    expect(calls[0][2]).toBe("desktop");
  });

  it("trackMatomoEvent dedupes via onceKey", async () => {
    const mod = await import("../matomo");
    mod.trackMatomoEvent({ category: "funnel", action: "add_to_cart", onceKey: "k1" });
    mod.trackMatomoEvent({ category: "funnel", action: "add_to_cart", onceKey: "k1" });
    expect(getPaq().filter((c) => c[0] === "trackEvent")).toHaveLength(1);
  });

  it("custom dimensions use the centralized id map", async () => {
    const mod = await import("../matomo");
    mod.setCustomDimension("pageType", "pdp");
    mod.setCustomDimension("productId", 42);
    const calls = getPaq();
    expect(calls).toContainEqual(["setCustomDimension", mod.CUSTOM_DIMENSIONS.pageType, "pdp"]);
    expect(calls).toContainEqual(["setCustomDimension", mod.CUSTOM_DIMENSIONS.productId, "42"]);
  });

  it("user identity lifecycle: set and reset (logout)", async () => {
    const mod = await import("../matomo");
    mod.setAnalyticsUserId(7);
    expect(getPaq()).toContainEqual(["setUserId", "7"]);

    (window as any)._paq = [];
    mod.resetAnalyticsUserId();
    const calls = getPaq();
    expect(calls).toContainEqual(["resetUserId"]);
    expect(calls).toContainEqual(["appendToTrackingUrl", "new_visit=1"]);
  });

  it("consent sync requires cookie consent and remembers only on grant", async () => {
    const mod = await import("../matomo");
    mod.syncMatomoConsentState("granted");
    expect(getPaq()).toContainEqual(["requireCookieConsent"]);
    expect(getPaq()).toContainEqual(["rememberCookieConsentGiven"]);

    (window as any)._paq = [];
    mod.syncMatomoConsentState("denied");
    expect(getPaq()).toContainEqual(["forgetCookieConsentGiven"]);
    expect(getPaq()).not.toContainEqual(["rememberCookieConsentGiven"]);
  });

  it("trackPageView sets url, title, referrer and re-enables link tracking", async () => {
    const mod = await import("../matomo");
    mod.trackPageView({ url: "https://x.co/pdp/abc", title: "Item", referrerUrl: "https://x.co/" });
    const calls = getPaq();
    expect(calls).toContainEqual(["setReferrerUrl", "https://x.co/"]);
    expect(calls).toContainEqual(["setCustomUrl", "https://x.co/pdp/abc"]);
    expect(calls).toContainEqual(["setDocumentTitle", "Item"]);
    expect(calls.some((c) => c[0] === "trackPageView")).toBe(true);
    expect(calls.some((c) => c[0] === "enableLinkTracking")).toBe(true);
  });
});
