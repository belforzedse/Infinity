/**
 * product-view service
 */

import { factories } from "@strapi/strapi";
import { RedisClient } from "../../../index";
import { parsePositiveInt } from "../../../utils/parsePositiveInt";

const DEFAULT_BUCKET_SECONDS = 60;
const DEFAULT_COUNTER_TTL_SECONDS = 60 * 60 * 24 * 2; // 48h safety window

function isAsyncCountersEnabled(): boolean {
  return String(process.env.ENABLE_ASYNC_VIEW_COUNTERS || "true").toLowerCase() !== "false";
}

function getBucketSeconds(): number {
  return parsePositiveInt(process.env.VIEW_COUNTER_BUCKET_SEC, DEFAULT_BUCKET_SECONDS);
}

function formatBucketStamp(date: Date, bucketSeconds: number): string {
  const bucketMs = bucketSeconds * 1000;
  const bucketedDate = new Date(Math.floor(date.getTime() / bucketMs) * bucketMs);

  const yyyy = bucketedDate.getUTCFullYear();
  const mm = String(bucketedDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(bucketedDate.getUTCDate()).padStart(2, "0");
  const hh = String(bucketedDate.getUTCHours()).padStart(2, "0");
  const min = String(bucketedDate.getUTCMinutes()).padStart(2, "0");
  const sec = String(bucketedDate.getUTCSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}-${hh}-${min}-${sec}`;
}

function buildCounterKey(kind: "product" | "blog", entityId: number, date = new Date()): string {
  const bucket = formatBucketStamp(date, getBucketSeconds());
  return `views:${kind}:${entityId}:${bucket}`;
}

async function getDelSafe(client: any, key: string): Promise<string | null> {
  if (typeof client.getDel === "function") {
    return client.getDel(key);
  }

  const value = await client.get(key);
  if (value !== null) {
    await client.del(key);
  }
  return value;
}

export default factories.createCoreService("api::product-view.product-view", ({ strapi }) => ({
  /**
   * Backward-compatible API. Kept for callers that still invoke incrementProductView.
   */
  async incrementProductView(productId: number): Promise<number> {
    if (isAsyncCountersEnabled()) {
      await this.queueProductView(productId);
      return 0;
    }

    try {
      await strapi.entityService.create("api::product-view.product-view", {
        data: {
          product: productId,
          viewedAt: new Date(),
        },
      });

      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const count = await strapi.entityService.count("api::product-view.product-view", {
        filters: {
          product: {
            id: productId,
          },
          viewedAt: {
            $gte: twentyFourHoursAgo.toISOString(),
          },
        },
      });

      await strapi.entityService.update("api::product.product", productId, {
        data: {
          SeenCount: count,
        },
      });

      return count;
    } catch (error) {
      strapi.log.error("[ProductView] Error incrementing product view:", error);
      try {
        const product = await strapi.entityService.findOne("api::product.product", productId, {
          fields: ["SeenCount"],
        });
        return product?.SeenCount || 0;
      } catch {
        return 0;
      }
    }
  },

  async queueProductView(productId: number): Promise<void> {
    if (!isAsyncCountersEnabled()) {
      await this.incrementProductView(productId);
      return;
    }

    if (!Number.isFinite(Number(productId))) return;

    try {
      const client = await RedisClient;
      const key = buildCounterKey("product", Number(productId));
      await client.incr(key);
      await client.expire(key, DEFAULT_COUNTER_TTL_SECONDS);
    } catch (error) {
      strapi.log.warn("[ProductView] Failed to queue product view", {
        productId,
        error: (error as Error)?.message,
      });
    }
  },

  async queueBlogPostView(blogPostId: number): Promise<void> {
    if (!isAsyncCountersEnabled()) {
      try {
        const post = await strapi.entityService.findOne("api::blog-post.blog-post", Number(blogPostId), {
          fields: ["ViewCount"],
        });
        const current = Number(post?.ViewCount || 0);
        await strapi.entityService.update("api::blog-post.blog-post", Number(blogPostId), {
          data: { ViewCount: current + 1 },
        });
      } catch (error) {
        strapi.log.warn("[ProductView] Failed to increment blog post view synchronously", {
          blogPostId,
          error: (error as Error)?.message,
        });
      }
      return;
    }

    if (!Number.isFinite(Number(blogPostId))) return;

    try {
      const client = await RedisClient;
      const key = buildCounterKey("blog", Number(blogPostId));
      await client.incr(key);
      await client.expire(key, DEFAULT_COUNTER_TTL_SECONDS);
    } catch (error) {
      strapi.log.warn("[ProductView] Failed to queue blog post view", {
        blogPostId,
        error: (error as Error)?.message,
      });
    }
  },

  async flushQueuedCounters(): Promise<void> {
    if (!isAsyncCountersEnabled()) {
      return;
    }

    try {
      const client = await RedisClient;
      const productTotals = new Map<number, number>();
      const blogTotals = new Map<number, number>();

      for await (const key of client.scanIterator({ MATCH: "views:product:*", COUNT: 200 })) {
        const rawValue = await getDelSafe(client, key);
        if (!rawValue) continue;

        const parts = String(key).split(":");
        const productId = Number(parts[2]);
        const delta = Number(rawValue);

        if (!Number.isFinite(productId) || !Number.isFinite(delta) || delta <= 0) continue;
        productTotals.set(productId, (productTotals.get(productId) || 0) + delta);
      }

      for await (const key of client.scanIterator({ MATCH: "views:blog:*", COUNT: 200 })) {
        const rawValue = await getDelSafe(client, key);
        if (!rawValue) continue;

        const parts = String(key).split(":");
        const blogPostId = Number(parts[2]);
        const delta = Number(rawValue);

        if (!Number.isFinite(blogPostId) || !Number.isFinite(delta) || delta <= 0) continue;
        blogTotals.set(blogPostId, (blogTotals.get(blogPostId) || 0) + delta);
      }

      for (const [productId, delta] of productTotals.entries()) {
        try {
          const product = await strapi.entityService.findOne("api::product.product", productId, {
            fields: ["SeenCount"],
          });
          if (!product) continue;

          await strapi.entityService.update("api::product.product", productId, {
            data: {
              SeenCount: Number(product.SeenCount || 0) + Number(delta),
            },
          });
        } catch (error) {
          strapi.log.warn("[ProductView] Failed to flush product counter", {
            productId,
            delta,
            error: (error as Error)?.message,
          });
        }
      }

      for (const [blogPostId, delta] of blogTotals.entries()) {
        try {
          const post = await strapi.entityService.findOne("api::blog-post.blog-post", blogPostId, {
            fields: ["ViewCount"],
          });
          if (!post) continue;

          await strapi.entityService.update("api::blog-post.blog-post", blogPostId, {
            data: {
              ViewCount: Number(post.ViewCount || 0) + Number(delta),
            },
          });
        } catch (error) {
          strapi.log.warn("[ProductView] Failed to flush blog counter", {
            blogPostId,
            delta,
            error: (error as Error)?.message,
          });
        }
      }
    } catch (error) {
      strapi.log.error("[ProductView] Failed to flush queued counters", error);
    }
  },
}));
