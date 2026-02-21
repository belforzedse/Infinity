/**
 * Redis-backed cache handler for Next.js ISR/Data Cache.
 * Shares cache across multiple Next.js instances (e.g. 12 frontend containers).
 * Requires REDIS_URL in environment. If Redis is unavailable, cache misses occur (no in-memory fallback when cacheMaxMemorySize: 0).
 */

import { createClient, type RedisClientType } from "redis";

interface CacheEntry {
  value: ReadableStream<Uint8Array>;
  tags?: string[];
  stale?: boolean;
  timestamp: number;
  expire?: number;
  revalidate?: number;
}

interface StoredCacheData {
  value: string;
  tags?: string[];
  stale?: boolean;
  timestamp: number;
  expire?: number;
  revalidate?: number;
}

class RedisCacheHandler {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    this.client = createClient({ url: redisUrl });

    this.client.on("error", (err: Error) => {
      console.error("Redis Cache Handler Error:", err);
    });

    this.client
      .connect()
      .then(() => {
        this.isConnected = true;
        console.log("Redis Cache Handler connected");
      })
      .catch((err: Error) => {
        console.error("Redis Cache Handler connection failed:", err);
      });
  }

  async get(
    cacheKey: string,
    _softTags?: string[]
  ): Promise<CacheEntry | undefined> {
    if (!this.isConnected) return undefined;

    try {
      const stored = await this.client.get(cacheKey);
      if (!stored) return undefined;

      const data: StoredCacheData = JSON.parse(stored);

      return {
        value: new ReadableStream({
          start(controller) {
            controller.enqueue(Buffer.from(data.value, "base64"));
            controller.close();
          },
        }),
        tags: data.tags,
        stale: data.stale,
        timestamp: data.timestamp,
        expire: data.expire,
        revalidate: data.revalidate,
      };
    } catch (error) {
      console.error("Cache get error:", error);
      return undefined;
    }
  }

  async set(
    cacheKey: string,
    pendingEntry: Promise<CacheEntry>
  ): Promise<void> {
    if (!this.isConnected) return;

    try {
      const entry = await pendingEntry;

      const reader = entry.value.getReader();
      const chunks: Uint8Array[] = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }

      const data = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));

      const cacheData: StoredCacheData = {
        value: data.toString("base64"),
        tags: entry.tags,
        stale: entry.stale,
        timestamp: entry.timestamp,
        expire: entry.expire,
        revalidate: entry.revalidate,
      };

      const options = entry.expire
        ? { EX: Math.ceil(entry.expire / 1000) }
        : undefined;
      await this.client.set(cacheKey, JSON.stringify(cacheData), options);
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  async revalidateTag(_tag: string): Promise<void> {
    if (!this.isConnected) return;
    // Tag-based invalidation would require tracking keys by tag in Redis.
    // Entries expire based on TTL; optional: maintain a Redis set per tag and delete those keys here.
  }
}

export default RedisCacheHandler;
