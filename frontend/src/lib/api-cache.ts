/**
 * Browser-Side API Cache with Stale-While-Revalidate
 *
 * Implements in-memory caching for API responses with:
 * - Stale-while-revalidate pattern (return cached immediately, fetch fresh in background)
 * - ETag support for conditional requests (304 Not Modified)
 * - Build version in cache keys for automatic invalidation on deployments
 * - Conservative TTLs to prevent stale data
 */

import { BUILD_VERSION } from "@/constants/build";

interface CachedResponse<T> {
  data: T;
  etag: string | null;
  timestamp: number;
  expiresAt: number;
  staleAt: number;
}

interface CacheConfig {
  maxAge: number; // Time before cache expires (milliseconds)
  staleWhileRevalidate: number; // Time to serve stale content while revalidating (milliseconds)
}

/**
 * Cache configuration by endpoint pattern
 */
const CACHE_CONFIGS: Array<{
  pattern: RegExp;
  config: CacheConfig;
}> = [
  // Static reference data - 60s cache, 5min stale window
  {
    pattern: /\/api\/(product-categories|product-tags|product-size-helpers|product-variation-colors|product-variation-sizes|product-variation-models|shipping|shipping-cities|shipping-provinces|footers|navigations)/i,
    config: { maxAge: 60000, staleWhileRevalidate: 300000 },
  },
  // Product data - 30s cache, 1min stale window
  {
    pattern: /\/api\/(products|product-variations|product-faqs|product-reviews|discounts|general-discounts)/i,
    config: { maxAge: 30000, staleWhileRevalidate: 60000 },
  },
];

// Endpoints that should never be cached
const NO_CACHE_PATTERNS = [
  /\/api\/auth/i, // Auth endpoints
  /\/api\/carts/i, // Cart (user-specific)
  /\/api\/orders/i, // Orders (user-specific)
  /\/api\/users/i, // User data
  /\/api\/local-user/i, // User info
  /\/api\/wallet/i, // Wallet (user-specific)
];

/**
 * Generate cache key from request details
 */
function generateCacheKey(method: string, url: string, paramsHash?: string): string {
  const urlObj = new URL(url);
  const path = urlObj.pathname;
  const search = urlObj.search;
  const hash = paramsHash || search || '';

  return `v${BUILD_VERSION}:${method}:${path}:${hash}`;
}

/**
 * Check if endpoint should be cached
 */
function shouldCache(method: string, url: string): boolean {
  // Never cache non-GET requests
  if (method.toUpperCase() !== "GET") {
    return false;
  }

  const urlObj = new URL(url);
  const path = urlObj.pathname;

  // Check no-cache patterns
  if (NO_CACHE_PATTERNS.some(pattern => pattern.test(path))) {
    return false;
  }

  // Check if matches a cacheable pattern
  return CACHE_CONFIGS.some(({ pattern }) => pattern.test(path));
}

/**
 * Get cache config for endpoint
 */
function getCacheConfig(url: string): CacheConfig | null {
  const urlObj = new URL(url);
  const path = urlObj.pathname;

  const match = CACHE_CONFIGS.find(({ pattern }) => pattern.test(path));
  return match?.config || null;
}

/**
 * Browser-Side API Cache
 */
class ApiCache {
  private cache = new Map<string, CachedResponse<any>>();
  private pendingRequests = new Map<string, Promise<any>>();

  /**
   * Get cached response if available and valid
   */
  get<T>(key: string): CachedResponse<T> | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();

    // Check if expired
    if (now >= cached.expiresAt) {
      // Remove expired entries
      this.cache.delete(key);
      return null;
    }

    return cached as CachedResponse<T>;
  }

  /**
   * Check if cached response is stale but still usable
   */
  isStale<T>(cached: CachedResponse<T> | null): boolean {
    if (!cached) {
      return false;
    }

    const now = Date.now();
    return now >= cached.staleAt && now < cached.expiresAt;
  }

  /**
   * Set cached response
   */
  set<T>(key: string, data: T, etag: string | null, config: CacheConfig): void {
    const now = Date.now();

    this.cache.set(key, {
      data,
      etag,
      timestamp: now,
      staleAt: now + config.maxAge, // Cache becomes stale after maxAge
      expiresAt: now + config.maxAge + config.staleWhileRevalidate, // Fully expires after maxAge + staleWhileRevalidate
    });
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Clear cached entries matching a pattern
   */
  clearByPattern(pattern: RegExp | string): void {
    const regex = typeof pattern === "string" ? new RegExp(pattern, "i") : pattern;
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear expired entries (cleanup)
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((cached, key) => {
      if (now >= cached.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Track pending request to avoid duplicates
   */
  setPending(key: string, promise: Promise<any>): void {
    this.pendingRequests.set(key, promise);

    // Clean up when promise resolves/rejects
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
  }

  /**
   * Get pending request if exists
   */
  getPending<T>(key: string): Promise<T> | null {
    return (this.pendingRequests.get(key) as Promise<T>) || null;
  }

  /**
   * Generate cache key from request details
   */
  generateKey(method: string, url: string, body?: unknown): string {
    let paramsHash = '';

    if (body) {
      try {
        // Hash body for cache key (simple hash for now)
        const bodyStr = JSON.stringify(body);
        paramsHash = bodyStr.length.toString(); // Simple hash, can be improved
      } catch {
        // Ignore serialization errors
      }
    }

    return generateCacheKey(method, url, paramsHash);
  }
}

// Singleton instance
const apiCache = new ApiCache();

// Periodic cleanup of expired entries (every 5 minutes)
if (typeof window !== "undefined") {
  setInterval(() => {
    apiCache.cleanup();
  }, 5 * 60 * 1000);
}

export { apiCache, shouldCache, getCacheConfig };
export type { CachedResponse, CacheConfig };

