/**
 * Shared helper to trigger Next.js on-demand revalidation from Strapi lifecycles.
 *
 * Posts to the frontend `/api/revalidate` route (protected by REVALIDATION_SECRET)
 * for every configured frontend URL. Used by site-identity and site-faq lifecycles.
 *
 * Mirrors the existing per-lifecycle revalidation pattern (see
 * api/settings/content-types/settings/lifecycles.ts) but shared so identity/faq
 * lifecycles don't each duplicate it.
 */

type RevalidatePayload = Record<string, unknown> & {
  type?: string;
  path?: string;
  tag?: string;
};

function getFrontendUrls(): string[] {
  return [
    process.env.NEXTJS_REVALIDATION_URL,
    "https://staging.infinitycolor.co",
    "https://infinitycolor.co",
  ].filter(Boolean) as string[];
}

export async function triggerFrontendRevalidation(
  payload: RevalidatePayload,
  logPrefix = "Revalidation",
): Promise<void> {
  const revalidationSecret = process.env.REVALIDATION_SECRET;
  if (!revalidationSecret) {
    strapi.log.error(`[${logPrefix}] REVALIDATION_SECRET environment variable is required`);
    return;
  }

  const frontendUrls = getFrontendUrls();

  const revalidationPromises = frontendUrls.map(async (frontendUrl) => {
    try {
      const url = `${frontendUrl.replace(/\/$/, "")}/api/revalidate`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${revalidationSecret}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        strapi.log.error(
          `[${logPrefix}] Revalidation failed for ${frontendUrl}: ${response.status} ${errorText}`,
        );
        return { url: frontendUrl, success: false };
      }

      strapi.log.info(`[${logPrefix}] Revalidated ${frontendUrl} (${JSON.stringify(payload)})`);
      return { url: frontendUrl, success: true };
    } catch (error: any) {
      if (error?.name === "AbortError") {
        strapi.log.warn(`[${logPrefix}] Revalidation timeout for ${frontendUrl}`);
      } else {
        strapi.log.error(
          `[${logPrefix}] Error triggering revalidation for ${frontendUrl}:`,
          error,
        );
      }
      return { url: frontendUrl, success: false };
    }
  });

  await Promise.allSettled(revalidationPromises);
}
