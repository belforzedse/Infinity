import { API_BASE_URL, ENDPOINTS } from "@/constants/api";
import fetchWithTimeout from "@/utils/fetchWithTimeout";
import logger from "@/utils/logger";

export interface CategoryData {
  id: number;
  attributes: {
    Title: string;
    Slug: string;
  };
}

/**
 * Sanitizes a category slug by removing trailing slashes and trimming whitespace
 */
function sanitizeCategorySlug(slug: string | undefined): string | null {
  if (!slug) return null;
  // Trim whites  pace and remove trailing slashes
  const sanitized = slug.trim().replace(/\/+$/, "");
  // Return null if   empty after sanitization
  if (!sanitized) return null;
  return sanitized;
}

/**
 * Validates if a category slug exists in the database
 * @param slug - The category slug to validate (may include trailing slashes)
 * @returns Category data if exists, null otherwise
 */
export async function validateCategorySlug(
  slug: string | undefined
): Promise<CategoryData | null> {
  // Sanitize the slug (remove trailing slashes, trim)
  const sanitizedSlug = sanitizeCategorySlug(slug);
  if (!sanitizedSlug) {
    return null;
  }

  try {
    // Build API endpoint to fetch category by slug
    const endpoint = `${API_BASE_URL}${ENDPOINTS.PRODUCT.CATEGORY}?filters[Slug][$eq]=${encodeURIComponent(sanitizedSlug)}&fields[0]=Title&fields[1]=Slug`;
  const response = await fetchWithTimeout(    endpoint, {
      timeoutMs: 10000,
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      logger.warn(`[Category Validation] Failed to fetch category: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const categories = data?.data || [];

    if (categories.length === 0) {
      logger.info(`[Category Validation] Category not found: ${sanitizedSlug}`);
      return null;
    }

    // Return the first matching category
    const category = categories[0];
    return {
      id: category.id,
      attributes: {
        Title: category.attributes?.Title || "",
        Slug: category.attributes?.Slug || sanitizedSlug,
      },
    };
  } catch (error) {
    logger.error(
      `[Category Validation] Error validating category slug "${sanitizedSlug}":`,
      { error }
    );
    // On error, return null to be safe (will trigger 404)
    return null;
  }
}

