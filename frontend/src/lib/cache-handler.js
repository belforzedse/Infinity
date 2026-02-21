/**
 * Redis-backed cache handler for Next.js ISR/Data Cache.
 * Uses dedicated frontend Redis (FRONTEND_REDIS_URL). Shares cache across multiple Next.js instances (e.g. 12 frontend containers).
 * Implements tiered caching: L1 = in-memory (handled by Next.js), L2 = Redis (this handler)
 *
 * Features:
 * - Connection timeout and retry with exponential backoff
 * - Health monitoring with periodic ping
 * - Graceful degradation on Redis failure (returns undefined for cache miss)
 * - Cache metrics logging for monitoring hit/miss rates
 * - Handles multiple cache entry types (streaming, full page, RSC)
 *
 * If Redis is unavailable, cache misses occur (Next.js falls back to regeneration).
 * When FRONTEND_REDIS_URL is unset or empty (e.g. during Docker build), Redis is disabled: no connection, no logs.
 */

const { createClient } = require("redis");

// Configuration constants
const REDIS_TIMEOUT_MS = 500; // Max time to wait for Redis operation
const REDIS_CONNECT_TIMEOUT_MS = 5000; // Max time to wait for initial connection
const HEALTH_CHECK_INTERVAL_MS = 30000; // Ping Redis every 30 seconds
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

class RedisCacheHandler {
  constructor() {
    const redisUrl = process.env.FRONTEND_REDIS_URL?.trim() || "";
    this.isConnected = false;
    this.client = null;
    this.healthCheckInterval = null;
    this.connectionPromise = null;
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      sets: 0,
      skipped: 0,
    };
    this.debug = process.env.FRONTEND_CACHE_DEBUG === "true";

    if (!redisUrl) {
      return;
    }

    this.client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
        reconnectStrategy: (retries) => {
          if (retries > MAX_RETRY_ATTEMPTS) {
            console.error("Redis: Max retry attempts reached, giving up");
            return false; // Stop retrying
          }
          const delay = Math.min(
            INITIAL_RETRY_DELAY_MS * Math.pow(2, retries),
            10000
          );
          console.log(`Redis: Reconnecting in ${delay}ms (attempt ${retries + 1}/${MAX_RETRY_ATTEMPTS})`);
          return delay;
        },
      },
    });

    // Handle connection errors and update state
    this.client.on("error", (err) => {
      console.error("Redis Cache Handler Error:", err.message);
      this.isConnected = false;
      this.metrics.errors++;
    });

    this.client.on("connect", () => {
      console.log("Redis: Connected");
      this.isConnected = true;
    });

    this.client.on("disconnect", () => {
      console.log("Redis: Disconnected");
      this.isConnected = false;
    });

    this.client.on("reconnecting", () => {
      console.log("Redis: Reconnecting...");
    });

    // Start connection
    this.connectionPromise = this.connect();

    // Start health check interval
    this.startHealthCheck();
  }

  async connect() {
    try {
      await this.client.connect();
      this.isConnected = true;
      console.log("Redis Cache Handler: Connected successfully");
    } catch (err) {
      console.error("Redis Cache Handler: Connection failed:", err.message);
      this.isConnected = false;
    }
  }

  startHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      if (!this.client || !this.isConnected) {
        return;
      }

      try {
        await this.withTimeout(this.client.ping(), REDIS_TIMEOUT_MS);
        // Connection is healthy
      } catch (error) {
        console.warn("Redis health check failed:", error.message);
        this.isConnected = false;
      }
    }, HEALTH_CHECK_INTERVAL_MS);
  }

  // Execute Redis operation with timeout
  async withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Redis operation timeout")), timeoutMs)
      ),
    ]);
  }

  // Check if entry is cacheable
  isCacheableEntry(entry) {
    if (!entry) return false;

    // Check for streaming entry (has ReadableStream value)
    if (entry.value && typeof entry.value.getReader === 'function') {
      return { type: 'stream', entry };
    }

    // Check for full page entry (has html property)
    if (entry.html !== undefined) {
      return { type: 'page', entry };
    }

    // Check for RSC entry
    if (entry.rscData !== undefined || entry.kind === 'RSC') {
      return { type: 'rsc', entry };
    }

    // Unknown entry type - don't cache but don't spam logs
    return { type: 'unknown', entry };
  }

  async get(cacheKey, _softTags) {
    // Wait for initial connection attempt if still pending
    if (this.connectionPromise) {
      try {
        await this.withTimeout(this.connectionPromise, REDIS_TIMEOUT_MS);
      } catch {
        // Connection timeout or error, proceed as if not connected
      }
      this.connectionPromise = null; // Clear after first attempt
    }

    if (!this.client || !this.isConnected) {
      this.metrics.misses++;
      return undefined;
    }

    try {
      const stored = await this.withTimeout(
        this.client.get(cacheKey),
        REDIS_TIMEOUT_MS
      );

      if (!stored) {
        this.metrics.misses++;
        return undefined;
      }

      const data = JSON.parse(stored);
      this.metrics.hits++;

      // Log metrics periodically (every 100 hits/misses)
      if ((this.metrics.hits + this.metrics.misses) % 100 === 0) {
        this.logMetrics();
      }

      // Restore the entry based on stored type
      if (data.type === 'stream' && data.value) {
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
      }

      // For page/rsc entries, return as-is
      return {
        value: data.value,
        html: data.html,
        rscData: data.rscData,
        kind: data.kind,
        postponed: data.postponed,
        headers: data.headers,
        status: data.status,
        segmentData: data.segmentData,
        tags: data.tags,
        stale: data.stale,
        timestamp: data.timestamp,
        expire: data.expire,
        revalidate: data.revalidate,
      };
    } catch (error) {
      console.error("Cache get error:", error.message);
      this.metrics.errors++;
      this.isConnected = false; // Mark as disconnected on error
      return undefined;
    }
  }

  async set(cacheKey, pendingEntry) {
    // Wait for initial connection attempt if still pending
    if (this.connectionPromise) {
      try {
        await this.withTimeout(this.connectionPromise, REDIS_TIMEOUT_MS);
      } catch {
        // Connection timeout or error
      }
      this.connectionPromise = null;
    }

    if (!this.client || !this.isConnected) {
      return;
    }

    // Validate pendingEntry is provided
    if (!pendingEntry) {
      if (this.debug) {
        console.warn(`Cache set skipped for key "${cacheKey}": pendingEntry is null/undefined`);
      }
      this.metrics.skipped++;
      return;
    }

    let entry;
    try {
      entry = await pendingEntry;
    } catch (fetchError) {
      if (this.debug) {
        console.warn(`Cache set skipped for key "${cacheKey}": pendingEntry rejected with error`, fetchError.message);
      }
      this.metrics.skipped++;
      return;
    }

    // Validate entry exists
    if (!entry) {
      if (this.debug) {
        console.warn(`Cache set skipped for key "${cacheKey}": entry is null/undefined after awaiting`);
      }
      this.metrics.skipped++;
      return;
    }

    // Check entry type
    const cacheable = this.isCacheableEntry(entry);

    if (cacheable.type === 'unknown') {
      // Silently skip unknown entry types in production
      if (this.debug) {
        console.warn(
          `Cache set skipped for key "${cacheKey}": unknown entry type. ` +
          `Entry keys: ${Object.keys(entry).join(', ')}`
        );
      }
      this.metrics.skipped++;
      return;
    }

    try {
      let cacheData;

      if (cacheable.type === 'stream') {
        // Handle streaming entry
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

        cacheData = {
          type: 'stream',
          value: data.toString("base64"),
          tags: entry.tags,
          stale: entry.stale,
          timestamp: entry.timestamp,
          expire: entry.expire,
          revalidate: entry.revalidate,
        };
      } else if (cacheable.type === 'page') {
        // Handle full page entry (non-streaming)
        cacheData = {
          type: 'page',
          html: entry.html,
          kind: entry.kind,
          postponed: entry.postponed,
          rscData: entry.rscData,
          headers: entry.headers,
          status: entry.status,
          segmentData: entry.segmentData,
          tags: entry.tags,
          stale: entry.stale,
          timestamp: entry.timestamp,
          expire: entry.expire,
          revalidate: entry.revalidate,
        };
      } else if (cacheable.type === 'rsc') {
        // Handle RSC entry
        cacheData = {
          type: 'rsc',
          kind: entry.kind,
          rscData: entry.rscData,
          html: entry.html,
          postponed: entry.postponed,
          headers: entry.headers,
          status: entry.status,
          segmentData: entry.segmentData,
          tags: entry.tags,
          stale: entry.stale,
          timestamp: entry.timestamp,
          expire: entry.expire,
          revalidate: entry.revalidate,
        };
      }

      const options = entry.expire
        ? { EX: Math.ceil(entry.expire / 1000) }
        : undefined;

      await this.withTimeout(
        this.client.set(cacheKey, JSON.stringify(cacheData), options),
        REDIS_TIMEOUT_MS
      );

      this.metrics.sets++;
    } catch (error) {
      console.error("Cache set error:", error.message);
      this.metrics.errors++;
      this.isConnected = false; // Mark as disconnected on error
    }
  }

  async revalidateTag(_tag) {
    // Wait for initial connection attempt if still pending
    if (this.connectionPromise) {
      try {
        await this.withTimeout(this.connectionPromise, REDIS_TIMEOUT_MS);
      } catch {
        // Connection timeout or error
      }
      this.connectionPromise = null;
    }

    if (!this.client || !this.isConnected) {
      return;
    }

    // Tag-based invalidation would require tracking keys by tag in Redis.
    // Entries expire based on TTL; optional: maintain a Redis set per tag and delete those keys here.
    // For now, we rely on TTL expiration.
  }

  logMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? ((this.metrics.hits / total) * 100).toFixed(1) : 0;
    console.log(
      `Redis Cache Metrics: hits=${this.metrics.hits}, misses=${this.metrics.misses}, ` +
      `hitRate=${hitRate}%, sets=${this.metrics.sets}, skipped=${this.metrics.skipped}, errors=${this.metrics.errors}`
    );
  }

  // Cleanup method for graceful shutdown
  async dispose() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.client) {
      try {
        await this.client.quit();
        console.log("Redis: Connection closed gracefully");
      } catch (err) {
        // Ignore errors during shutdown
      }
    }
  }
}

module.exports = RedisCacheHandler;
