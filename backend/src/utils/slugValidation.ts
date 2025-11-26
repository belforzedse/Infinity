import { Strapi } from "@strapi/strapi";

// Reserved routes that blog post slugs cannot use
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
 * Validates if a slug is allowed for blog posts
 * @param slug - The slug to validate
 * @returns true if valid, false if conflicts with reserved routes
 */
export function isValidBlogSlug(slug: string): boolean {
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
 * Checks if a slug is already in use by another blog post
 * @param strapi - Strapi instance
 * @param slug - The slug to check
 * @param excludeId - Optional ID to exclude from the check (for updates)
 * @returns true if slug is available, false if already in use
 */
export async function isBlogSlugAvailable(
  strapi: Strapi,
  slug: string,
  excludeId?: number
): Promise<boolean> {
  try {
    const filters: any = { Slug: slug };

    // Exclude current post when updating
    if (excludeId) {
      filters.id = { $ne: excludeId };
    }

    const existingPosts = await strapi.entityService.findMany("api::blog-post.blog-post", {
      filters,
      pagination: { limit: 1 }
    });

    return existingPosts.length === 0;
  } catch (error) {
    strapi.log.error("Error checking blog slug availability:", error);
    return false;
  }
}

/**
 * Validates a blog post slug completely
 * @param strapi - Strapi instance
 * @param slug - The slug to validate
 * @param excludeId - Optional ID to exclude from the check (for updates)
 * @returns object with validation result and error message if invalid
 */
export async function validateBlogSlug(
  strapi: Strapi,
  slug: string,
  excludeId?: number
): Promise<{ isValid: boolean; error?: string }> {
  // Check basic format and reserved routes
  if (!isValidBlogSlug(slug)) {
    return {
      isValid: false,
      error: "Slug conflicts with reserved routes or contains invalid characters"
    };
  }

  // Check if slug is already in use
  const isAvailable = await isBlogSlugAvailable(strapi, slug, excludeId);
  if (!isAvailable) {
    return {
      isValid: false,
      error: "Slug is already in use by another blog post"
    };
  }

  return { isValid: true };
}

/**
 * Generates a unique slug from a title
 * @param strapi - Strapi instance
 * @param title - The title to generate slug from
 * @param excludeId - Optional ID to exclude from uniqueness check
 * @returns a unique slug
 */
export async function generateUniqueBlogSlug(
  strapi: Strapi,
  title: string,
  excludeId?: number
): Promise<string> {
  // Basic slug generation
  let baseSlug = title
    .toLowerCase()
    .replace(/[^\u0600-\u06FF\w\s-]/g, '') // Keep Persian, English, numbers, spaces, hyphens
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();

  // If base slug is invalid or empty, use fallback
  if (!baseSlug || !isValidBlogSlug(baseSlug)) {
    baseSlug = `post-${Date.now()}`;
  }

  let slug = baseSlug;
  let counter = 1;

  // Keep trying until we find a unique slug
  while (!(await isBlogSlugAvailable(strapi, slug, excludeId))) {
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
