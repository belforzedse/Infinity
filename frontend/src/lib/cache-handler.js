/**
 * Redis-backed cache handler for Next.js ISR/Data Cache.
 * Uses dedicated frontend Redis (FRONTEND_REDIS_URL). Shares cache across multiple Next.js instances (e.g. 12 frontend containers).
 * If Redis is unavailable, cache misses occur (no in-memory fallback when cacheMaxMemorySize: 0).
 * When FRONTEND_REDIS_URL is unset or empty (e.g. during Docker build), Redis is disabled: no connection, no logs.
 */

const { createClient } = require("redis");

class RedisCacheHandler {
  constructor() {
    const redisUrl = process.env.FRONTEND_REDIS_URL?.trim() || "";
    this.isConnected = false;
    this.client = null;

    if (!redisUrl) {
      return;
    }

    this.client = createClient({ url: redisUrl });

    this.client.on("error", (err) => {
      console.error("Redis Cache Handler Error:", err);
    });

    this.client
      .connect()
      .then(() => {
        this.isConnected = true;
        console.log("Redis Cache Handler connected");
      })
      .catch((err) => {
        console.error("Redis Cache Handler connection failed:", err);
      });
  }

  async get(cacheKey, _softTags) {
    if (!this.client || !this.isConnected) return undefined;

    try {
      const stored = await this.client.get(cacheKey);
      if (!stored) return undefined;

      const data = JSON.parse(stored);

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

  async set(cacheKey, pendingEntry) {
    if (!this.client || !this.isConnected) return;

    // Validate pendingEntry is provided
    if (!pendingEntry) {
      console.warn(`Cache set skipped for key "${cacheKey}": pendingEntry is null/undefined`);
      return;
    }

    let entry;
    try {
      entry = await pendingEntry;
    } catch (fetchError) {
      console.warn(`Cache set skipped for key "${cacheKey}": pendingEntry rejected with error`, fetchError.message);
      return;
    }

    // Validate entry exists
    if (!entry) {
      console.warn(`Cache set skipped for key "${cacheKey}": entry is null/undefined after awaiting`);
      return;
    }

    // Validate entry.value exists and is a ReadableStream
    if (!entry.value || typeof entry.value.getReader !== 'function') {
      console.warn(
        `Cache set skipped for key "${cacheKey}": entry.value is not a ReadableStream. ` +
        `Type: ${typeof entry.value}, ` +
        `Keys: ${entry.value ? Object.keys(entry.value).join(', ') : 'N/A'}, ` +
        `Entry keys: ${Object.keys(entry).join(', ')}`
      );
      return;
    }

    try {
      const reader = entry.value.getReader();
      const chunks = [];

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

      const cacheData = {
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

  async revalidateTag(_tag) {
    if (!this.client || !this.isConnected) return;
    // Tag-based invalidation would require tracking keys by tag in Redis.
    // Entries expire based on TTL; optional: maintain a Redis set per tag and delete those keys here.
  }
}

module.exports = RedisCacheHandler;
