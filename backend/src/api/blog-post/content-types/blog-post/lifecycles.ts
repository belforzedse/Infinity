/**
 * Blog Post Lifecycle Hooks
 *
 * Triggers Next.js on-demand revalidation when blog posts are published or updated
 */

/**
 * Call Next.js revalidation API to invalidate cache
 * Supports multiple frontend URLs (staging, production)
 */
async function triggerRevalidation(slug: string) {
  // Hardcoded for now (TODO: move to environment variables)
  const frontendUrls = [
    "https://staging.infinitycolor.org",
    "https://infinitycolor.org",
  ];

  // Hardcoded secret (must match frontend)
  const revalidationSecret = "REVALIDATION_SECRET";

  // Trigger revalidation for all configured frontend URLs
  const revalidationPromises = frontendUrls.map(async (frontendUrl) => {
    try {
      const url = `${frontendUrl.replace(/\/$/, "")}/api/revalidate`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${revalidationSecret}`,
        },
        body: JSON.stringify({
          path: slug, // Pass slug without leading slash, API will normalize it
          type: "blog-post",
        }),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        strapi.log.error(`[Blog Post Lifecycle] Revalidation failed for ${frontendUrl}: ${response.status} ${errorText}`);
        return { url: frontendUrl, success: false };
      }

      const result = await response.json();
      strapi.log.info(`[Blog Post Lifecycle] Revalidation triggered for ${frontendUrl}/${slug}`, result);
      return { url: frontendUrl, success: true };
    } catch (error: any) {
      if (error.name === "AbortError") {
        strapi.log.warn(`[Blog Post Lifecycle] Revalidation timeout for ${frontendUrl}`);
      } else {
        strapi.log.error(`[Blog Post Lifecycle] Error triggering revalidation for ${frontendUrl}:`, error);
      }
      return { url: frontendUrl, success: false };
    }
  });

  const results = await Promise.allSettled(revalidationPromises);
  const successful = results.filter((r) => r.status === "fulfilled" && r.value?.success).length;
  strapi.log.info(`[Blog Post Lifecycle] Revalidation completed: ${successful}/${frontendUrls.length} successful`);
}

export default {
  async afterCreate(event: any) {
    const { result } = event;

    // Only trigger revalidation if post is published
    if (result?.Status === "Published" && result?.Slug) {
      await triggerRevalidation(result.Slug);
    }
  },

  async afterUpdate(event: any) {
    const { result } = event;

    // Trigger revalidation when:
    // 1. Post is published (Status changed to Published)
    // 2. Post is updated and already published
    if (result?.Status === "Published" && result?.Slug) {
      await triggerRevalidation(result.Slug);
    }
  },

  async afterDelete(event: any) {
    // Revalidate blog listing when a post is deleted
    // Hardcoded for now (TODO: move to environment variables)
    const frontendUrls = [
      "https://staging.infinitycolor.org",
      "https://infinitycolor.org",
    ];
    const revalidationSecret = "REVALIDATION_SECRET";

    const revalidationPromises = frontendUrls.map(async (frontendUrl) => {
      try {
        const url = `${frontendUrl.replace(/\/$/, "")}/api/revalidate`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${revalidationSecret}`,
          },
          body: JSON.stringify({
            type: "blog-listing",
          }),
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          strapi.log.info(`[Blog Post Lifecycle] Blog listing revalidated for ${frontendUrl}`);
          return { url: frontendUrl, success: true };
        }
        return { url: frontendUrl, success: false };
      } catch (error: any) {
        if (error.name === "AbortError") {
          strapi.log.warn(`[Blog Post Lifecycle] Revalidation timeout for ${frontendUrl}`);
        } else {
          strapi.log.error(`[Blog Post Lifecycle] Error revalidating blog listing for ${frontendUrl}:`, error);
        }
        return { url: frontendUrl, success: false };
      }
    });

    await Promise.allSettled(revalidationPromises);
  },
};

