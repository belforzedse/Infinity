/**
 * Browser-side API cache with stale-while-revalidate, ETag support, and configurable path rules.
 */

export interface CacheConfig {
  maxAge: number;
  staleWhileRevalidate: number;
}

export interface CachedResponse<T> {
  data: T;
  etag: string | null;
  timestamp: number;
  expiresAt: number;
  staleAt: number;
}

export interface ApiCacheRule {
  pattern: RegExp;
  config: CacheConfig;
}

export interface ApiCacheOptions {
  /** Bumped on deploy for cache key namespacing */
  buildVersion: string;
  cacheConfigs: ApiCacheRule[];
  noCachePatterns: RegExp[];
}

function safeUrlParse(url: string, fallbackOrigin?: string): URL | null {
  try {
    return new URL(url);
  } catch {
    try {
      const baseOrigin =
        typeof window !== "undefined" && window.location
          ? window.location.origin
          : fallbackOrigin || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost";
      return new URL(url, baseOrigin);
    } catch {
      return null;
    }
  }
}

function generateCacheKey(
  buildVersion: string,
  method: string,
  url: string,
  paramsHash?: string,
  fallbackOrigin?: string,
): string {
  const urlObj = safeUrlParse(url, fallbackOrigin);
  if (!urlObj) {
    return `v${buildVersion}:${method}:${url}:${paramsHash || ""}`;
  }

  const path = urlObj.pathname;
  const search = urlObj.search;
  const hash = paramsHash || search || "";

  return `v${buildVersion}:${method}:${path}:${hash}`;
}

function shouldCacheForUrl(
  method: string,
  url: string,
  options: ApiCacheOptions,
  fallbackOrigin?: string,
): boolean {
  if (method.toUpperCase() !== "GET") {
    return false;
  }

  const urlObj = safeUrlParse(url, fallbackOrigin);
  if (!urlObj) {
    return false;
  }

  const path = urlObj.pathname;

  if (options.noCachePatterns.some((pattern) => pattern.test(path))) {
    return false;
  }

  return options.cacheConfigs.some(({ pattern }) => pattern.test(path));
}

function getCacheConfigForUrl(
  url: string,
  options: ApiCacheOptions,
  fallbackOrigin?: string,
): CacheConfig | null {
  const urlObj = safeUrlParse(url, fallbackOrigin);
  if (!urlObj) {
    return null;
  }

  const path = urlObj.pathname;

  const match = options.cacheConfigs.find(({ pattern }) => pattern.test(path));
  return match?.config || null;
}

export class ApiCache {
  private readonly cache = new Map<string, CachedResponse<unknown>>();
  private readonly pendingRequests = new Map<string, Promise<unknown>>();
  private readonly options: ApiCacheOptions;

  constructor(options: ApiCacheOptions) {
    this.options = options;
  }

  get<T>(key: string): CachedResponse<T> | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();

    if (now >= cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached as CachedResponse<T>;
  }

  isStale<T>(cached: CachedResponse<T> | null): boolean {
    if (!cached) {
      return false;
    }

    const now = Date.now();
    return now >= cached.staleAt && now < cached.expiresAt;
  }

  set<T>(key: string, data: T, etag: string | null, config: CacheConfig): void {
    const now = Date.now();

    this.cache.set(key, {
      data,
      etag,
      timestamp: now,
      staleAt: now + config.maxAge,
      expiresAt: now + config.maxAge + config.staleWhileRevalidate,
    });
  }

  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  clearByPattern(pattern: RegExp | string): void {
    const regex = typeof pattern === "string" ? new RegExp(pattern, "i") : pattern;
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((cached, key) => {
      if (now >= cached.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  setPending(key: string, promise: Promise<unknown>): void {
    this.pendingRequests.set(key, promise);

    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
  }

  getPending<T>(key: string): Promise<T> | null {
    return (this.pendingRequests.get(key) as Promise<T>) || null;
  }

  generateKey(method: string, url: string, body?: unknown): string {
    let paramsHash = "";

    if (body) {
      try {
        const bodyStr = JSON.stringify(body);
        let hash = 5381;
        for (let i = 0; i < bodyStr.length; i++) {
          hash = (hash << 5) + hash + bodyStr.charCodeAt(i);
        }
        paramsHash = Math.abs(hash).toString(16).padStart(8, "0");
      } catch (error) {
        console.warn("[api-cache] Failed to hash request body:", error);
        paramsHash = Date.now().toString();
      }
    }

    return generateCacheKey(this.options.buildVersion, method, url, paramsHash);
  }

  shouldCache(method: string, url: string): boolean {
    return shouldCacheForUrl(method, url, this.options);
  }

  getCacheConfig(url: string): CacheConfig | null {
    return getCacheConfigForUrl(url, this.options);
  }
}

/** Start periodic cleanup in the browser (call once from app bootstrap if desired). */
export function startApiCacheCleanup(apiCache: ApiCache, intervalMs = 5 * 60 * 1000): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  const id = window.setInterval(() => {
    apiCache.cleanup();
  }, intervalMs);
  return () => window.clearInterval(id);
}
