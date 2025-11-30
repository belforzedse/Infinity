/**
 * Cache Headers Middleware
 *
 * Adds HTTP cache headers (Cache-Control, ETag) and handles conditional requests (304 Not Modified).
 * Uses stale-while-revalidate pattern for optimal performance with data freshness.
 */

import type { Context } from "koa";
import crypto from "crypto";
import { Strapi } from "@strapi/strapi";

// Cache control strategies based on endpoint patterns
const CACHE_STRATEGIES = {
  // Static/reference data - safe to cache for 1 minute, stale for 5 minutes
  static: {
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 300, // 5 minutes
    public: true,
  },

  // Product data - 30 seconds cache, 1 minute stale window
  product: {
    maxAge: 30, // 30 seconds
    staleWhileRevalidate: 60, // 1 minute
    public: true,
  },

  // User-specific data - no cache
  user: {
    noCache: true,
    mustRevalidate: true,
    private: true,
  },

  // Auth endpoints - no store
  auth: {
    noStore: true,
    noCache: true,
    mustRevalidate: true,
  },
};

// Endpoint patterns for cache strategy matching
const ENDPOINT_PATTERNS = {
  // Static reference data (safe to cache)
  static: [
    /^\/api\/product-categories/i,
    /^\/api\/product-tags/i,
    /^\/api\/product-size-helpers/i,
    /^\/api\/product-variation-colors/i,
    /^\/api\/product-variation-sizes/i,
    /^\/api\/product-variation-models/i,
    /^\/api\/shipping/i,
    /^\/api\/shipping-cities/i,
    /^\/api\/shipping-provinces/i,
    /^\/api\/footers/i,
    /^\/api\/navigations/i,
  ],

  // Product data (semi-dynamic, short cache)
  product: [
    /^\/api\/products/i,
    /^\/api\/product-variations/i,
    /^\/api\/product-faqs/i,
    /^\/api\/product-reviews/i,
    /^\/api\/discounts/i,
    /^\/api\/general-discounts/i,
  ],

  // User-specific data (no cache)
  user: [
    /^\/api\/carts/i,
    /^\/api\/orders/i,
    /^\/api\/users/i,
    /^\/api\/local-user/i,
    /^\/api\/wallet/i,
  ],

  // Auth endpoints (no store)
  auth: [
    /^\/api\/auth/i,
  ],
};

/**
 * Determine cache strategy based on endpoint path
 */
function getCacheStrategy(path: string): typeof CACHE_STRATEGIES[keyof typeof CACHE_STRATEGIES] {
  // Check auth first (most restrictive)
  if (ENDPOINT_PATTERNS.auth.some(pattern => pattern.test(path))) {
    return CACHE_STRATEGIES.auth;
  }

  // Check user-specific data
  if (ENDPOINT_PATTERNS.user.some(pattern => pattern.test(path))) {
    return CACHE_STRATEGIES.user;
  }

  // Check static reference data
  if (ENDPOINT_PATTERNS.static.some(pattern => pattern.test(path))) {
    return CACHE_STRATEGIES.static;
  }

  // Check product data
  if (ENDPOINT_PATTERNS.product.some(pattern => pattern.test(path))) {
    return CACHE_STRATEGIES.product;
  }

  // Default: no cache for unknown endpoints
  return CACHE_STRATEGIES.user;
}

/**
 * Generate ETag from response body
 */
function generateETag(body: any): string {
  try {
    const bodyString = typeof body === "string" ? body : JSON.stringify(body);
    const hash = crypto.createHash("md5").update(bodyString).digest("hex");
    return `"${hash.substring(0, 16)}"`; // Use first 16 chars, wrap in quotes
  } catch (error) {
    // Fallback to timestamp-based ETag if serialization fails
    return `"${Date.now()}"`;
  }
}

/**
 * Build Cache-Control header string from strategy
 */
function buildCacheControlHeader(strategy: typeof CACHE_STRATEGIES[keyof typeof CACHE_STRATEGIES]): string {
  const directives: string[] = [];

  if ("noStore" in strategy && strategy.noStore) {
    directives.push("no-store");
  }

  if ("noCache" in strategy && strategy.noCache) {
    directives.push("no-cache");
  }

  if ("mustRevalidate" in strategy && strategy.mustRevalidate) {
    directives.push("must-revalidate");
  }

  if ("private" in strategy && strategy.private) {
    directives.push("private");
  } else if ("public" in strategy && strategy.public) {
    directives.push("public");
  }

  const hasNoStore = "noStore" in strategy && strategy.noStore;
  const hasNoCache = "noCache" in strategy && strategy.noCache;

  if ("maxAge" in strategy && strategy.maxAge !== undefined && !hasNoStore && !hasNoCache) {
    directives.push(`max-age=${strategy.maxAge}`);
  }

  if ("staleWhileRevalidate" in strategy && strategy.staleWhileRevalidate !== undefined && !hasNoStore && !hasNoCache) {
    directives.push(`stale-while-revalidate=${strategy.staleWhileRevalidate}`);
  }

  return directives.join(", ");
}

export default (_config: any, { strapi }: { strapi: Strapi }) => {
  return async (ctx: Context, next: any) => {
    // Only process API routes (skip admin panel and static files)
    const path = ctx.request.path || ctx.url || "";

    if (!path.startsWith("/api/")) {
      return next();
    }

    // Only handle GET requests for caching (POST/PUT/DELETE bypass cache)
    const method = ctx.request.method?.toUpperCase() || "";
    if (method !== "GET") {
      // Set no-cache for non-GET requests
      ctx.set("Cache-Control", "no-store, no-cache, must-revalidate");
      return next();
    }

    // Get cache strategy for this endpoint
    const strategy = getCacheStrategy(path);

    // Check for If-None-Match header (conditional request)
    const ifNoneMatch = ctx.request.headers["if-none-match"];

    // Execute the route handler
    await next();

    // Skip cache headers for error responses
    if (ctx.status >= 400) {
      ctx.set("Cache-Control", "no-store, no-cache, must-revalidate");
      return;
    }

    // Skip cache headers for non-JSON responses
    const contentType = ctx.response.headers["content-type"] || "";
    if (!contentType.includes("application/json")) {
      ctx.set("Cache-Control", "no-store, no-cache, must-revalidate");
      return;
    }

    // Generate ETag from response body
    const responseBody = ctx.body;
    const etag = generateETag(responseBody);

    // Set ETag header
    ctx.set("ETag", etag);

    // Handle conditional request (If-None-Match)
    if (ifNoneMatch && etag === ifNoneMatch) {
      // Resource hasn't changed - return 304 Not Modified
      ctx.status = 304;
      ctx.body = null; // No body for 304 responses
      ctx.remove("Content-Type");
      ctx.remove("Content-Length");

      // Still set cache-control header
      ctx.set("Cache-Control", buildCacheControlHeader(strategy));
      return;
    }

    // Set Cache-Control header based on strategy
    ctx.set("Cache-Control", buildCacheControlHeader(strategy));

    // Add Vary header for proper cache keying (if strategy uses it)
    if ("public" in strategy && strategy.public) {
      // Vary by Accept and Authorization (if present) for proper cache keying
      const varyHeaders: string[] = ["Accept"];
      if (ctx.request.headers.authorization) {
        varyHeaders.push("Authorization");
      }
      if (varyHeaders.length > 0) {
        ctx.set("Vary", varyHeaders.join(", "));
      }
    }
  };
};

