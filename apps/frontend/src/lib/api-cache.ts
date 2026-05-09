/**
 * Storefront browser API cache: path rules and build version are app-specific;
 * implementation lives in `@repo/api/cache`.
 */

import { ApiCache, startApiCacheCleanup, type ApiCacheRule } from "@repo/api/cache";
import { BUILD_VERSION } from "@/constants/build";

const CACHE_CONFIGS: ApiCacheRule[] = [
  {
    pattern:
      /\/api\/(product-categories|product-tags|product-size-helpers|product-variation-colors|product-variation-sizes|product-variation-models|shipping|shipping-cities|shipping-provinces|footers|navigations)/i,
    config: { maxAge: 60000, staleWhileRevalidate: 300000 },
  },
  {
    pattern:
      /\/api\/(products|product-variations|product-faqs|product-reviews|discounts|general-discounts)/i,
    config: { maxAge: 30000, staleWhileRevalidate: 60000 },
  },
  {
    pattern:
      /\/api\/(blog-posts|blog-comments\/post|blog-categories|blog-tags|blog-authors|faq-categories|faq-questions)/i,
    config: { maxAge: 60000, staleWhileRevalidate: 120000 },
  },
];

const NO_CACHE_PATTERNS = [
  /\/api\/auth/i,
  /\/api\/carts/i,
  /\/api\/orders/i,
  /\/api\/users/i,
  /\/api\/local-user/i,
  /\/api\/wallet/i,
];

export const apiCache = new ApiCache({
  buildVersion: BUILD_VERSION,
  cacheConfigs: CACHE_CONFIGS,
  noCachePatterns: NO_CACHE_PATTERNS,
});

if (typeof window !== "undefined") {
  startApiCacheCleanup(apiCache);
}
