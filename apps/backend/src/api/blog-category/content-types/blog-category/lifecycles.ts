import { generateUnicodeSlug } from "../../../../utils/unicodeSlug";

/**
 * Ensures the record has a category slug by setting `Slug` from `Slug` or `Title`.
 *
 * If `data` is falsy or both `Slug` and `Title` are missing, the function does nothing.
 *
 * @param data - Object representing the record; its `Slug` property is set to a Unicode category slug derived from `Slug` if present, otherwise from `Title`
 */
function ensureSlug(data: Record<string, any>) {
  if (!data) return;

  const source = data.Slug || data.Title;
  if (!source) return;

  data.Slug = generateUnicodeSlug(source, "category");
}

async function triggerBlogListingRevalidation() {
  const frontendUrls = [
    "https://staging.infinitycolor.org",
    "https://infinitycolor.co",
  ];

  const revalidationSecret = process.env.REVALIDATION_SECRET;
  if (!revalidationSecret) {
    strapi.log.error("[Blog Category Lifecycle] REVALIDATION_SECRET environment variable is required");
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
          `[Blog Category Lifecycle] Revalidation failed for ${frontendUrl}: ${response.status} ${errorText}`,
        );
        return { url: frontendUrl, success: false };
      }

      strapi.log.info(`[Blog Category Lifecycle] Blog listing revalidated for ${frontendUrl}`);
      return { url: frontendUrl, success: true };
    } catch (error: any) {
      if (error.name === "AbortError") {
        strapi.log.warn(`[Blog Category Lifecycle] Revalidation timeout for ${frontendUrl}`);
      } else {
        strapi.log.error(
          `[Blog Category Lifecycle] Error triggering revalidation for ${frontendUrl}:`,
          error,
        );
      }
      return { url: frontendUrl, success: false };
    }
  });

  await Promise.allSettled(revalidationPromises);
}

export default {
  beforeCreate(event) {
    ensureSlug(event.params.data);
  },
  beforeUpdate(event) {
    ensureSlug(event.params.data);
  },
  async afterCreate() {
    await triggerBlogListingRevalidation();
  },
  async afterUpdate() {
    await triggerBlogListingRevalidation();
  },
  async afterDelete() {
    await triggerBlogListingRevalidation();
  },
};
