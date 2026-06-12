import { defineConfig, devices } from "@playwright/test";
import { storefrontBaseURL, strapiApiURL, strapiOrigin } from "./helpers/env";

const isCI = !!process.env.CI;
const webServerCommand = process.env.E2E_WEB_SERVER_COMMAND?.trim();

export default defineConfig({
  testDir: "./tests",
  outputDir: "test-results",
  globalSetup: "./scripts/global-setup.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: Number(process.env.E2E_WORKERS || 1),
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    [isCI ? "dot" : "list"],
    ["junit", { outputFile: "e2e-results.xml" }],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: storefrontBaseURL(),
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1100 },
      },
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 7"],
      },
    },
  ],
  webServer: webServerCommand
    ? {
        command: webServerCommand,
        url: storefrontBaseURL(),
        reuseExistingServer: !isCI,
        timeout: Number(process.env.E2E_WEB_SERVER_TIMEOUT_MS || 120_000),
        env: {
          ...process.env,
          NEXT_PUBLIC_API_BASE_URL: strapiApiURL(),
          NEXT_PUBLIC_IMAGE_BASE_URL: strapiOrigin(),
          STRAPI_INTERNAL_URL: strapiApiURL(),
        },
      }
    : undefined,
});
