import type { Strapi } from "@strapi/strapi";
import { parsePositiveInt } from "../utils/parsePositiveInt";

const DEFAULT_FLUSH_INTERVAL_MS = 60_000;

function isEnabled(): boolean {
  return String(process.env.ENABLE_ASYNC_VIEW_COUNTERS || "true").toLowerCase() !== "false";
}

export function startFlushViewCountersJob(strapi: Strapi) {
  if (!isEnabled()) {
    return;
  }

  const intervalMs = parsePositiveInt(
    process.env.VIEW_COUNTER_FLUSH_INTERVAL_MS,
    DEFAULT_FLUSH_INTERVAL_MS,
  );

  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;

    try {
      const viewService = strapi.service("api::product-view.product-view") as {
        flushQueuedCounters: () => Promise<void>;
      };

      await viewService.flushQueuedCounters();
    } catch (error) {
      strapi.log.error("flushViewCounters job failed", error);
    } finally {
      running = false;
    }
  };

  setTimeout(() => {
    tick().catch((error) => {
      strapi.log.error("flushViewCounters initial run failed", error);
    });
  }, 20_000);

  setInterval(() => {
    tick().catch((error) => {
      strapi.log.error("flushViewCounters scheduled run failed", error);
    });
  }, intervalMs);
}
