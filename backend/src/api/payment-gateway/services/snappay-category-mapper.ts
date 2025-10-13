/**
 * SnapPay Category Mapper
 *
 * Maps product categories to SnapPay's expected category format.
 * According to SnapPay documentation (line 554-559), the category field should follow
 * their predefined category list based on the merchant's contract.
 *
 * Reference: SnappPay Rest API document section "نحوه ارسال دسته‌بندی کمیسیون"
 *
 * This module reads category mappings from the database (product-category.snappay_category field)
 * which can be managed through the Strapi admin panel.
 */

import type { Strapi } from "@strapi/strapi";

// Cache for category mappings to avoid repeated DB queries
let categoryMappingsCache: Record<string, string> | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Load category mappings from database
 * @param strapi - Strapi instance
 * @returns Promise of category mappings
 */
async function loadCategoryMappingsFromDB(
  strapi: Strapi
): Promise<Record<string, string>> {
  try {
    const categories = (await strapi.entityService.findMany(
      "api::product-category.product-category",
      {
        fields: ["Title", "snappay_category"] as any,
      }
    )) as Array<{ Title?: string; snappay_category?: string }>;

    const mappings: Record<string, string> = {};

    for (const cat of categories as any[]) {
      if (cat.Title) {
        // Use snappay_category if set, otherwise use the category Title itself
        mappings[cat.Title] = cat.snappay_category || cat.Title;
      }
    }

    return mappings;
  } catch (error) {
    strapi.log.error("Failed to load SnapPay category mappings from DB", error);
    return {};
  }
}

/**
 * Get category mappings with caching
 * @param strapi - Strapi instance
 * @returns Promise of category mappings
 */
async function getCategoryMappings(
  strapi: Strapi
): Promise<Record<string, string>> {
  const now = Date.now();

  // Return cached mappings if still valid
  if (categoryMappingsCache && now - lastCacheTime < CACHE_DURATION) {
    return categoryMappingsCache;
  }

  // Reload mappings from DB
  categoryMappingsCache = await loadCategoryMappingsFromDB(strapi);
  lastCacheTime = now;

  return categoryMappingsCache;
}

/**
 * Maps a product category name to SnapPay's expected category format
 *
 * @param strapi - Strapi instance
 * @param categoryName - The category name from your product database
 * @returns Promise of the corresponding SnapPay category code
 */
export async function mapToSnappayCategory(
  strapi: Strapi,
  categoryName?: string
): Promise<string> {
  if (!categoryName) {
    return "سایر"; // Default to "Other" if no category provided
  }

  // Normalize the input: trim whitespace
  const normalizedInput = categoryName.trim();

  // Get mappings from DB (with caching)
  const mappings = await getCategoryMappings(strapi);

  // Try exact match first
  if (mappings[normalizedInput]) {
    return mappings[normalizedInput];
  }

  // If no mapping exists, return the category name as-is
  // This assumes your category names already match SnapPay's expected format
  return normalizedInput;
}

/**
 * Clear the category mappings cache
 * Call this after updating categories in the admin panel
 */
export function clearCategoryCache(): void {
  categoryMappingsCache = null;
  lastCacheTime = 0;
}
