/**
 * Redis-backed cache handler for Next.js ISR/Data Cache.
 * Uses @neshca/cache-handler with redis-strings (plain Redis) and local-lru fallback.
 * Shares cache across multiple Next.js instances (e.g. 12 frontend containers).
 *
 * Architecture:
 * - L1: Next.js in-memory cache (256MB per instance, handled by Next.js)
 * - L2: Redis (shared across instances) when FRONTEND_REDIS_URL is set
 * - Fallback: local-lru (in-memory only) when Redis is unavailable or unset
 *
 * Build-safe: Works without Redis during Docker build (FRONTEND_REDIS_URL unset).
 * Uses global cache for handler config so only one Redis connection is created per process.
 */

import { CacheHandler } from '@neshca/cache-handler';
import createRedisHandler from '@neshca/cache-handler/redis-strings';
import createLruHandler from '@neshca/cache-handler/local-lru';
import { createClient } from 'redis';

const LRU_OPTIONS = {
  maxItemSizeBytes: 256 * 1024 * 1024, // 256MB max per item
  maxItemsNumber: 10000,
};

function createLruOnlyConfig() {
  return {
    handlers: [
      createLruHandler(LRU_OPTIONS),
    ],
  };
}

CacheHandler.onCreation(async () => {
  // Reuse existing config so we create only one Redis connection per process
  // (Next.js may call onCreation multiple times in some setups)
  if (global.cacheHandlerConfig) {
    return global.cacheHandlerConfig;
  }
  if (global.cacheHandlerConfigPromise) {
    return global.cacheHandlerConfigPromise;
  }

  const redisUrl = process.env.FRONTEND_REDIS_URL?.trim();

  if (!redisUrl) {
    console.info('[CacheHandler] FRONTEND_REDIS_URL not set, using local LRU handler only');
    global.cacheHandlerConfig = createLruOnlyConfig();
    return global.cacheHandlerConfig;
  }

  let client;
  try {
    client = createClient({ url: redisUrl });
    client.on('error', (err) => {
      if (typeof process.env.NEXT_PRIVATE_DEBUG_CACHE !== 'undefined') {
        console.error('[CacheHandler] Redis client error:', err);
      }
      global.cacheHandlerConfig = null;
      global.cacheHandlerConfigPromise = null;
    });
  } catch (error) {
    console.warn('[CacheHandler] Failed to create Redis client:', error?.message ?? error);
    global.cacheHandlerConfig = createLruOnlyConfig();
    return global.cacheHandlerConfig;
  }

  const init = async () => {
    try {
      console.info('[CacheHandler] Connecting Redis client...');
      await client.connect();
      console.info('[CacheHandler] Redis client connected.');
    } catch (error) {
      console.warn('[CacheHandler] Failed to connect Redis client:', error?.message ?? error);
      try {
        await client.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      const config = createLruOnlyConfig();
      console.warn('[CacheHandler] Falling back to local LRU handler because Redis is not available');
      global.cacheHandlerConfig = config;
      global.cacheHandlerConfigPromise = null;
      return config;
    }

    if (!client?.isReady) {
      const config = createLruOnlyConfig();
      global.cacheHandlerConfig = config;
      global.cacheHandlerConfigPromise = null;
      return config;
    }

    const handler = await createRedisHandler({
      client,
      keyPrefix: 'infinity:',
      timeoutMs: 1000,
      keyExpirationStrategy: 'EXAT', // Requires Redis 6.2+ (e.g. redis:7-alpine)
    });
    console.info('[CacheHandler] Using redis-strings handler with shared Redis');
    const config = { handlers: [handler] };
    global.cacheHandlerConfig = config;
    global.cacheHandlerConfigPromise = null;
    return config;
  };

  global.cacheHandlerConfigPromise = init();
  return global.cacheHandlerConfigPromise;
});

export default CacheHandler;
