async function triggerBlogListingRevalidation() {
  const frontendUrls = [
    "https://staging.infinitycolor.org",
    "https://new.infinitycolor.co",
  ];

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
          type: "blog-listing",
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        strapi.log.error(
          `[Settings Lifecycle] Revalidation failed for ${frontendUrl}: ${response.status} ${errorText}`,
        );
        return { url: frontendUrl, success: false };
      }

      strapi.log.info(`[Settings Lifecycle] Blog listing revalidated for ${frontendUrl}`);
      return { url: frontendUrl, success: true };
    } catch (error: any) {
      if (error.name === "AbortError") {
        strapi.log.warn(`[Settings Lifecycle] Revalidation timeout for ${frontendUrl}`);
      } else {
        strapi.log.error(
          `[Settings Lifecycle] Error triggering revalidation for ${frontendUrl}:`,
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
    await triggerBlogListingRevalidation();
  },
};
