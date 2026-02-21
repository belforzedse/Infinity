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
 */

import { CacheHandler } from '@neshca/cache-handler';
import createRedisHandler from '@neshca/cache-handler/redis-strings';
import createLruHandler from '@neshca/cache-handler/local-lru';
import { createClient } from 'redis';

CacheHandler.onCreation(async () => {
  // Check if Redis should be used
  const redisUrl = process.env.FRONTEND_REDIS_URL?.trim();

  // No Redis URL provided - use LRU only (for build or when Redis is not configured)
  if (!redisUrl) {
    console.info('[CacheHandler] FRONTEND_REDIS_URL not set, using local LRU handler only');
    const lruHandler = createLruHandler({
      maxItemSizeBytes: 256 * 1024 * 1024, // 256MB max per item
      maxItemsNumber: 10000,
    });
    return {
      handlers: [lruHandler],
    };
  }

  let client;

  try {
    // Create Redis client
    client = createClient({
      url: redisUrl,
    });

    // Redis error handling - only log in debug mode to avoid log flooding
    client.on('error', (error) => {
      if (typeof process.env.NEXT_PRIVATE_DEBUG_CACHE !== 'undefined') {
        console.error('Redis client error:', error);
      }
    });
  } catch (error) {
    console.warn('Failed to create Redis client:', error.message);
  }

  if (client) {
    try {
      console.info('Connecting Redis client...');
      await client.connect();
      console.info('Redis client connected.');
    } catch (error) {
      console.warn('Failed to connect Redis client:', error.message);

      // Try to disconnect to stop reconnection attempts
      try {
        await client.disconnect();
        console.info('Redis client disconnected after failed connection.');
      } catch {
        // Ignore disconnect errors
      }

      // Clear client so we fall back to LRU
      client = null;
    }
  }

  let handler;

  if (client?.isReady) {
    // Redis is ready - use redis-strings handler with 1s timeout
    handler = await createRedisHandler({
      client,
      keyPrefix: 'infinity:',
      timeoutMs: 1000,
      // Use EXAT (more efficient, requires Redis 6.2+ which redis:7-alpine has)
      keyExpirationStrategy: 'EXAT',
    });
    console.info('[CacheHandler] Using redis-strings handler with shared Redis');
  } else {
    // Redis not available - fall back to LRU
    handler = createLruHandler({
      maxItemSizeBytes: 256 * 1024 * 1024,
      maxItemsNumber: 10000,
    });
    console.warn('[CacheHandler] Falling back to local LRU handler because Redis is not available');
  }

  return {
    handlers: [handler],
  };
});

export default CacheHandler;
