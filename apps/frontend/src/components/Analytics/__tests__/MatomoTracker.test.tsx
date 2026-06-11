/**
 * Verifies SPA pageview correctness: exactly one pageview per navigation, no
 * duplicate on rerender, and the title is read AFTER the (deferred) frame so the
 * new route's metadata title is captured.
 */
import React from "react";
import { render, act } from "@testing-library/react";

let pathname = "/";
let searchString = "";

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(searchString),
}));

jest.mock("jotai", () => ({
  useAtomValue: () => null,
}));

jest.mock("@/lib/atoms/auth", () => ({ currentUserAtom: {} }));

import { MatomoTracker } from "../MatomoTracker";

function getPaq(): Array<[string, ...any[]]> {
  return (window as any)._paq || [];
}

function countPageViews() {
  return getPaq().filter((c) => c[0] === "trackPageView").length;
}

describe("MatomoTracker", () => {
  let rafQueue: FrameRequestCallback[];

  beforeEach(() => {
    pathname = "/";
    searchString = "";
    (window as any)._paq = [];
    (window as any).__matomoInitialized = false;
    process.env.NEXT_PUBLIC_MATOMO_ENABLE_DEV = "true";
    process.env.NEXT_PUBLIC_MATOMO_URL = "https://analytics.infinitycolor.co";
    process.env.NEXT_PUBLIC_MATOMO_SITE_ID = "1";

    rafQueue = [];
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_MATOMO_ENABLE_DEV;
    (window as any).__matomoInitialized = false;
  });

  function flushFrames() {
    // Two nested rAFs are used to defer the title read; flush both.
    act(() => {
      const q = rafQueue;
      rafQueue = [];
      q.forEach((cb) => cb(0));
    });
    act(() => {
      const q = rafQueue;
      rafQueue = [];
      q.forEach((cb) => cb(0));
    });
  }

  it("fires exactly one pageview on initial mount, after deferral", () => {
    document.title = "Home";
    render(<MatomoTracker />);
    // Before frames flush, the title-deferred pageview hasn't fired yet.
    expect(countPageViews()).toBe(0);
    flushFrames();
    expect(countPageViews()).toBe(1);
    expect(getPaq()).toContainEqual(["setDocumentTitle", "Home"]);
  });

  it("does not duplicate the pageview on rerender of the same path", () => {
    const { rerender } = render(<MatomoTracker />);
    flushFrames();
    rerender(<MatomoTracker />);
    flushFrames();
    expect(countPageViews()).toBe(1);
  });

  it("fires a second pageview on client-side navigation with the new title", () => {
    document.title = "Home";
    const { rerender } = render(<MatomoTracker />);
    flushFrames();
    expect(countPageViews()).toBe(1);

    // Navigate; the new route commits its metadata title before the deferred read.
    pathname = "/pdp/red-shoes";
    document.title = "Red Shoes";
    rerender(<MatomoTracker />);
    flushFrames();

    expect(countPageViews()).toBe(2);
    expect(getPaq()).toContainEqual(["setDocumentTitle", "Red Shoes"]);
  });

  it("is inert when analytics is disabled", () => {
    process.env.NEXT_PUBLIC_MATOMO_ENABLE_DEV = "false"; // NODE_ENV=test -> disabled
    render(<MatomoTracker />);
    flushFrames();
    expect(countPageViews()).toBe(0);
  });
});
