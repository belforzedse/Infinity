import { Strapi } from "@strapi/strapi";
import { generateUnicodeSlug } from "./unicodeSlug";

// Reserved routes that product slugs cannot use
const RESERVED_ROUTES = [
  // Public routes
  "plp",
  "pdp",
  "categories",
  "search",
  "auth",
  "login",
  "register",
  "forgot-password",
  "cart",
  "checkout",
  "payment",
  "api",

  // User routes
  "account",
  "addresses",
  "favorites",
  "orders",
  "password",
  "privileges",
  "wallet",

  // Blog routes
  "blog",

  // Super admin routes
  "super-admin",

  // Common web paths
  "admin",
  "dashboard",
  "home",
  "about",
  "contact",
  "privacy",
  "terms",
  "sitemap",
  "robots",
  "favicon",
  "manifest",

  // File extensions and common paths
  "css",
  "js",
  "images",
  "assets",
  "static",
  "public",
  "_next",

  // API endpoints
  "graphql",
  "rest",
  "webhooks",
];

/**
 * Validates if a slug is allowed for products
 * @param slug - The slug to validate
 * @returns true if valid, false if conflicts with reserved routes
 */
export function isValidProductSlug(slug: string): boolean {
  if (!slug || typeof slug !== "string") {
    return false;
  }

  // Normalize slug for comparison
  const normalizedSlug = slug.toLowerCase().trim();

  // Check against reserved routes
  if (RESERVED_ROUTES.includes(normalizedSlug)) {
    return false;
  }

  // Check for common patterns that might conflict
  const conflictPatterns = [
    /^api\//,           // API routes
    /^_/,               // Next.js internal routes
    /^\./,              // Hidden files
    /^admin/,           // Admin routes
    /^super-admin/,     // Super admin routes
    /\.(js|css|png|jpg|jpeg|gif|svg|ico|json|xml|txt)$/i, // File extensions
  ];

  for (const pattern of conflictPatterns) {
    if (pattern.test(normalizedSlug)) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if a slug is already in use by another product
 * @param strapi - Strapi instance
 * @param slug - The slug to check
 * @param excludeId - Optional ID to exclude from the check (for updates)
 * @returns true if slug is available, false if already in use
 */
export async function isProductSlugAvailable(
  strapi: Strapi,
  slug: string,
  excludeId?: number
): Promise<boolean> {
  try {
    const filters: Record<string, unknown> = { Slug: slug };

    // Exclude current product when updating
    if (excludeId) {
      filters.id = { $ne: excludeId };
    }

    const existingProducts = await strapi.entityService.findMany("api::product.product", {
      filters,
      pagination: { limit: 1 }
    });

    return (existingProducts as unknown[]).length === 0;
  } catch (error) {
    strapi.log.error("Error checking product slug availability:", error);
    return false;
  }
}

/**
 * Validates a product slug completely
 * @param strapi - Strapi instance
 * @param slug - The slug to validate
 * @param excludeId - Optional ID to exclude from the check (for updates)
 * @returns object with validation result and error message if invalid
 */
export async function validateProductSlug(
  strapi: Strapi,
  slug: string,
  excludeId?: number
): Promise<{ isValid: boolean; error?: string }> {
  // Check basic format and reserved routes
  if (!isValidProductSlug(slug)) {
    return {
      isValid: false,
      error: "Slug conflicts with reserved routes or contains invalid characters"
    };
  }

  // Check if slug is already in use
  const isAvailable = await isProductSlugAvailable(strapi, slug, excludeId);
  if (!isAvailable) {
    return {
      isValid: false,
      error: "Slug is already in use by another product"
    };
  }

  return { isValid: true };
}

/**
 * Generates a unique slug from a product title
 * Uses Persian-compatible slug generation
 * @param strapi - Strapi instance
 * @param title - The title to generate slug from
 * @param excludeId - Optional ID to exclude from uniqueness check
 * @returns a unique slug
 */
export async function generateUniqueProductSlug(
  strapi: Strapi,
  title: string,
  excludeId?: number
): Promise<string> {
  // Use the unicode slug generator for Persian support
  let baseSlug = generateUnicodeSlug(title, "product");

  // If base slug is invalid, use fallback
  if (!isValidProductSlug(baseSlug)) {
    baseSlug = `product-${Date.now()}`;
  }

  let slug = baseSlug;
  let counter = 1;

  // Keep trying until we find a unique slug
  while (!(await isProductSlugAvailable(strapi, slug, excludeId))) {
    slug = `${baseSlug}-${counter}`;
    counter++;

    // Prevent infinite loops
    if (counter > 1000) {
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
}


