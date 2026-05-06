import {
  buildCacheKey,
  shouldBypassEndpointCache,
  withCache,
} from "../responseCache";
import { RedisClient } from "../../index";

describe("responseCache", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    const redis = await (RedisClient as unknown as Promise<any>);
    redis.get.mockReset();
    redis.set.mockReset();
    redis.del.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("builds deterministic cache keys regardless of query key order", () => {
    const key1 = buildCacheKey({
      routeId: "product.search",
      params: { slug: "foo" },
      query: { b: 2, a: 1 },
      locale: "fa",
      authSegment: "anon",
    });

    const key2 = buildCacheKey({
      routeId: "product.search",
      params: { slug: "foo" },
      query: { a: 1, b: 2 },
      locale: "fa",
      authSegment: "anon",
    });

    expect(key1).toEqual(key2);
  });

  it("bypasses cache when authorization header exists and anonymous-only mode is enabled", () => {
    process.env.ENABLE_ENDPOINT_RESPONSE_CACHE = "true";
    process.env.CACHE_ONLY_ANONYMOUS = "true";

    const bypass = shouldBypassEndpointCache({ authorization: "Bearer token" });
    expect(bypass).toBe(true);
  });

  it("supports MISS then HIT flow", async () => {
    const redis = await (RedisClient as unknown as Promise<any>);
    redis.get.mockResolvedValueOnce(null).mockResolvedValueOnce(JSON.stringify({ ok: true }));
    redis.set.mockResolvedValue("OK");

    const statuses: string[] = [];
    const loader = jest.fn(async () => ({ ok: true }));

    const missResult = await withCache(
      {
        key: "endpoint-cache:test",
        ttlSec: 60,
        bypass: false,
        onStatus: (status) => statuses.push(status),
      },
      loader,
    );

    const hitResult = await withCache(
      {
        key: "endpoint-cache:test",
        ttlSec: 60,
        bypass: false,
        onStatus: (status) => statuses.push(status),
      },
      loader,
    );

    expect(missResult).toEqual({ ok: true });
    expect(hitResult).toEqual({ ok: true });
    expect(loader).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledTimes(1);
    expect(statuses).toEqual(["MISS", "HIT"]);
  });

  it("supports BYPASS mode", async () => {
    const redis = await (RedisClient as unknown as Promise<any>);
    const loader = jest.fn(async () => ({ bypassed: true }));
    const statuses: string[] = [];

    const result = await withCache(
      {
        key: "endpoint-cache:bypass",
        ttlSec: 60,
        bypass: true,
        onStatus: (status) => statuses.push(status),
      },
      loader,
    );

    expect(result).toEqual({ bypassed: true });
    expect(loader).toHaveBeenCalledTimes(1);
    expect(redis.get).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
    expect(statuses).toEqual(["BYPASS"]);
  });
});
