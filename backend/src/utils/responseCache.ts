import crypto from "crypto";
import { RedisClient } from "../index";

export type CacheStatus = "HIT" | "MISS" | "BYPASS";

type CacheKeyOptions = {
  routeId: string;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  locale?: string | null;
  authSegment?: "anon" | "auth";
};

type WithCacheOptions<T> = {
  key: string;
  ttlSec: number;
  bypass?: boolean;
  onStatus?: (status: CacheStatus) => void;
  shouldCacheValue?: (value: T) => boolean;
};

function isTrue(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function normalizeForStableStringify(input: unknown): unknown {
  if (input === null || input === undefined) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => normalizeForStableStringify(item));
  }

  if (typeof input === "object") {
    const record = input as Record<string, unknown>;
    const sortedKeys = Object.keys(record).sort((a, b) => a.localeCompare(b));
    const output: Record<string, unknown> = {};

    for (const key of sortedKeys) {
      output[key] = normalizeForStableStringify(record[key]);
    }

    return output;
  }

  return input;
}

export function getCacheTtlFromEnv(envName: string, fallback: number): number {
  const parsed = Number(process.env[envName]);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function isEndpointResponseCacheEnabled(): boolean {
  return isTrue(process.env.ENABLE_ENDPOINT_RESPONSE_CACHE, true);
}

export function isCacheOnlyAnonymousEnabled(): boolean {
  return isTrue(process.env.CACHE_ONLY_ANONYMOUS, true);
}

export function isCacheDebugHeaderEnabled(): boolean {
  return isTrue(process.env.CACHE_DEBUG_HEADER, false);
}

export function hasAuthorizationHeader(headers?: Record<string, unknown>): boolean {
  const authHeader = headers?.authorization ?? headers?.Authorization;
  if (Array.isArray(authHeader)) {
    return authHeader.some((value) => String(value || "").trim().length > 0);
  }
  return String(authHeader || "").trim().length > 0;
}

export function shouldBypassEndpointCache(headers?: Record<string, unknown>): boolean {
  if (!isEndpointResponseCacheEnabled()) {
    return true;
  }

  if (!isCacheOnlyAnonymousEnabled()) {
    return false;
  }

  return hasAuthorizationHeader(headers);
}

export function buildCacheKey(options: CacheKeyOptions): string {
  const routeId = options.routeId || "unknown";
  const locale = options.locale || "default";
  const authSegment = options.authSegment || "anon";
  const normalizedPayload = normalizeForStableStringify({
    params: options.params || {},
    query: options.query || {},
  });

  const digest = crypto
    .createHash("sha1")
    .update(JSON.stringify(normalizedPayload))
    .digest("hex");

  return `endpoint-cache:${routeId}:${authSegment}:${locale}:${digest}`;
}

export async function getJson<T>(key: string): Promise<T | null> {
  try {
    const client = await RedisClient;
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJson(key: string, value: unknown, ttlSec: number): Promise<boolean> {
  if (!Number.isFinite(ttlSec) || ttlSec <= 0) {
    return false;
  }

  try {
    const client = await RedisClient;
    await client.set(key, JSON.stringify(value), { EX: Math.floor(ttlSec) });
    return true;
  } catch {
    return false;
  }
}

export async function delByPattern(prefix: string): Promise<number> {
  if (!prefix) return 0;

  try {
    const client = await RedisClient;
    let removed = 0;

    for await (const key of client.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) {
      removed += await client.del(key);
    }

    return removed;
  } catch {
    return 0;
  }
}

export async function withCache<T>(
  options: WithCacheOptions<T>,
  loader: () => Promise<T>,
): Promise<T> {
  const { key, ttlSec, bypass = false, onStatus, shouldCacheValue } = options;

  if (bypass) {
    onStatus?.("BYPASS");
    return loader();
  }

  const cached = await getJson<T>(key);
  if (cached !== null) {
    onStatus?.("HIT");
    return cached;
  }

  const value = await loader();
  const canCache = shouldCacheValue ? shouldCacheValue(value) : true;

  if (canCache) {
    await setJson(key, value, ttlSec);
  }

  onStatus?.("MISS");
  return value;
}
