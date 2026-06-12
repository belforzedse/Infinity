import { expect, type Page } from "@playwright/test";

const THIRD_PARTY_PATTERN =
  /(?:matomo|googletagmanager|google-analytics|sentry|clarity|facebook|doubleclick)/i;

const IGNORED_RUNTIME_ERROR_PATTERN =
  /(?:Failed to load resource|net::ERR_ABORTED|net::ERR_BLOCKED_BY_CLIENT|favicon\.ico|ResizeObserver loop|_next\/webpack-hmr|WebSocket connection.*ERR_INVALID_HTTP_RESPONSE)/i;

export type RuntimeErrorCollector = {
  errors: string[];
  assertClean: () => void;
};

export async function prepareStorefrontPage(page: Page): Promise<RuntimeErrorCollector> {
  const errors: string[] = [];

  await page.route(THIRD_PARTY_PATTERN, (route) => route.abort());

  await page.addInitScript(() => {
    window.localStorage.setItem("analytics-consent", "denied");
    window.localStorage.setItem("pdp_debug", "0");
  });

  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (THIRD_PARTY_PATTERN.test(text)) return;
    errors.push(`console.error: ${text}`);
  });

  return {
    errors,
    assertClean: () => {
      const critical = errors.filter((error) => !IGNORED_RUNTIME_ERROR_PATTERN.test(error));
      expect(critical).toEqual([]);
    },
  };
}

export async function expectImageLoaded(locator: ReturnType<Page["locator"]>) {
  await expect(locator).toBeVisible();
  await expect
    .poll(
      async () =>
        locator.evaluate((image) => {
          const img = image as HTMLImageElement;
          return {
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          };
        }),
      { timeout: 10_000 },
    )
    .toMatchObject({ complete: true, naturalWidth: expect.any(Number), naturalHeight: expect.any(Number) });

  const size = await locator.evaluate((image) => {
    const img = image as HTMLImageElement;
    return { width: img.naturalWidth, height: img.naturalHeight };
  });
  expect(size.width).toBeGreaterThan(0);
  expect(size.height).toBeGreaterThan(0);
}
