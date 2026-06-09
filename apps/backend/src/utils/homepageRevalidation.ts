import { triggerFrontendRevalidation } from "./revalidate";

type RevalidationMetadata = Record<string, unknown>;

const HOMEPAGE_PRODUCT_REVALIDATION_PAYLOAD = {
  type: "home-products",
};

export async function triggerHomeProductsRevalidation(
  reason: string,
  metadata?: RevalidationMetadata,
): Promise<void> {
  if (!(globalThis as any).strapi?.log) {
    return;
  }

  await triggerFrontendRevalidation(
    {
      ...HOMEPAGE_PRODUCT_REVALIDATION_PAYLOAD,
      reason,
      metadata,
    },
    "Home Products Revalidation",
  );
}

export function scheduleHomeProductsRevalidation(
  reason: string,
  metadata?: RevalidationMetadata,
  trx?: any,
): void {
  const run = () => {
    void triggerHomeProductsRevalidation(reason, metadata).catch((error) => {
      (globalThis as any).strapi?.log?.error(
        "[Home Products Revalidation] Failed to trigger revalidation",
        error,
      );
    });
  };

  if (trx?.executionPromise && typeof trx.executionPromise.then === "function") {
    void trx.executionPromise.then(run).catch((error: any) => {
      (globalThis as any).strapi?.log?.warn(
        `[Home Products Revalidation] Skipped after transaction failure (${reason})`,
        error,
      );
    });
    return;
  }

  run();
}
