async function triggerSiteSettingsRevalidation() {
  const frontendUrls = [
    process.env.NEXTJS_REVALIDATION_URL,
    "https://staging.infinitycolor.co",
    "https://infinitycolor.co",
  ].filter(Boolean);

  const revalidationSecret = process.env.REVALIDATION_SECRET;
  if (!revalidationSecret) {
    strapi.log.error("[Settings Lifecycle] REVALIDATION_SECRET environment variable is required");
    return;
  }

  const revalidationPromises = frontendUrls.map(async (frontendUrl) => {
    try {
      const url = `${frontendUrl.replace(/\/$/, "")}/api/revalidate`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${revalidationSecret}`,
        },
        body: JSON.stringify({
          type: "site-settings",
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        strapi.log.error(
          `[Settings Lifecycle] Site settings revalidation failed for ${frontendUrl}: ${response.status} ${errorText}`,
        );
        return { url: frontendUrl, success: false };
      }

      strapi.log.info(`[Settings Lifecycle] Site settings revalidated for ${frontendUrl}`);
      return { url: frontendUrl, success: true };
    } catch (error: any) {
      if (error.name === "AbortError") {
        strapi.log.warn(`[Settings Lifecycle] Revalidation timeout for ${frontendUrl}`);
      } else {
        strapi.log.error(
          `[Settings Lifecycle] Error triggering site settings revalidation for ${frontendUrl}:`,
          error,
        );
      }
      return { url: frontendUrl, success: false };
    }
  });

  await Promise.allSettled(revalidationPromises);
}

export default {
  async afterUpdate() {
    await triggerSiteSettingsRevalidation();
  },
};
