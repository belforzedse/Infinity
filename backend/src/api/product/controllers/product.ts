/**
 * product controller
 */

import { factories } from "@strapi/strapi";
import { roleIsAllowed, MANAGEMENT_ROLES } from "../../../utils/roles";
import {
  buildCacheKey,
  getCacheTtlFromEnv,
  isCacheDebugHeaderEnabled,
  shouldBypassEndpointCache,
  withCache,
  type CacheStatus,
} from "../../../utils/responseCache";

/**
 * Check if the user is an admin (superadmin, store manager, or editor)
 * Supports both plugin::users-permissions.user roles and local-user roles
 * @param user - The user object from ctx.state.user
 * @returns true if user is an admin, false otherwise
 */
function isAdminUser(user: any): boolean {
  if (!user) return false;

  // Check explicit isAdmin flag (set by auth/self endpoint)
  if (user?.isAdmin === true) {
    return true;
  }

  // Check local-user role (role ID 2 is admin)
  const userRoleId = user?.user_role?.id;
  if (userRoleId === 2) {
    return true;
  }

  // Check plugin::users-permissions role using existing utilities
  const roleName = user?.role?.name;
  if (roleName) {
    // Use existing role matching utility with MANAGEMENT_ROLES
    if (roleIsAllowed(roleName, MANAGEMENT_ROLES)) {
      return true;
    }
  }

  return false;
}

function readProductStatus(product: any): string | undefined {
  return product?.attributes?.Status || product?.Status;
}

function readProductRemovedAt(product: any): string | null | undefined {
  return product?.attributes?.removedAt || product?.removedAt;
}

function setCacheHeaderIfEnabled(ctx: any, status: CacheStatus) {
  if (!isCacheDebugHeaderEnabled()) return;
  ctx.set("X-Backend-Cache", status);
}

const PRODUCT_POPULATE = {
  CoverImage: true,
  Media: true,
  Files: true,
  product_main_category: true,
  product_other_categories: true,
  product_tags: true,
  product_reviews: {
    populate: {
      user: {
        fields: ["id", "username", "phone", "email"],
        populate: {
          user_info: {
            fields: ["FirstName", "LastName"],
          },
        },
      },
    },
  },
  product_variations: {
    populate: {
      product_variation_color: true,
      product_variation_size: true,
      product_variation_model: true,
      product_stock: true,
    },
  },
  product_faqs: true,
  product_size_helper: {
    populate: {
      Image: true,
    },
  },
} as const;

async function findProductBySlugInternal(
  strapi: any,
  decodedSlug: string,
  isAdmin: boolean,
): Promise<any | null> {
  const filters: any = {
    Slug: decodedSlug,
    removedAt: { $null: true },
  };

  if (!isAdmin) {
    filters.Status = "Active";
  }

  let products = await strapi.entityService.findMany("api::product.product", {
    filters,
    populate: PRODUCT_POPULATE,
    pagination: { limit: 1 },
  });

  let product = (products as unknown[])[0] || null;

  if (!product) {
    strapi.log.info(
      `[Product.findBySlug] No exact match for slug: "${decodedSlug}", trying raw SQL query...`,
    );
    try {
      const knex = strapi.db.connection;
      let rawQuery = knex("products").where("slug", decodedSlug).whereNull("removed_at");

      if (!isAdmin) {
        rawQuery = rawQuery.where("status", "Active");
      }

      const rawProducts = await rawQuery.limit(1);
      if (rawProducts.length > 0) {
        const productId = rawProducts[0].id;
        const foundFilters: any = { id: productId };

        if (!isAdmin) {
          foundFilters.Status = "Active";
        }

        const foundProducts = await strapi.entityService.findMany("api::product.product", {
          filters: foundFilters,
          populate: PRODUCT_POPULATE,
          pagination: { limit: 1 },
        });
        product = (foundProducts as unknown[])[0] || null;
        if (product) {
          strapi.log.info(`[Product.findBySlug] Found product via raw SQL query: ${productId}`);
        }
      }
    } catch (sqlError) {
      strapi.log.warn("[Product.findBySlug] Raw SQL query failed:", sqlError);
    }
  }

  if (!product) {
    strapi.log.info(
      `[Product.findBySlug] No product found with slug: "${decodedSlug}", trying ID fallback...`,
    );

    const idMatch = decodedSlug.match(/^\d+$/);
    if (idMatch) {
      const productId = parseInt(decodedSlug, 10);
      strapi.log.info(`[Product.findBySlug] Attempting ID-based lookup for product ID: ${productId}`);

      const idFilters: any = {
        id: productId,
        removedAt: { $null: true },
      };

      if (!isAdmin) {
        idFilters.Status = "Active";
      }

      const productsById = await strapi.entityService.findMany("api::product.product", {
        filters: idFilters,
        populate: PRODUCT_POPULATE,
        pagination: { limit: 1 },
      });

      const productById = (productsById as unknown[])[0] || null;
      if (productById) {
        strapi.log.info(`[Product.findBySlug] Found product by ID: ${productId}`);
        return productById;
      }

      strapi.log.warn(
        `[Product.findBySlug] Product with ID ${productId} not found or is trashed`,
      );
    } else {
      strapi.log.warn(
        `[Product.findBySlug] Slug "${decodedSlug}" is not numeric, cannot use ID fallback`,
      );
    }
  }

  return product;
}

export default factories.createCoreController(
  "api::product.product",
  ({ strapi }) => ({
    /**
     * Apply public-only filters for non-admin users
     * Ensures drafts/removed products are hidden from non-admins
     */
    applyPublicProductFilters(ctx) {
      const user = ctx.state.user;
      const isAdmin = isAdminUser(user);
      if (isAdmin) {
        return false;
      }

      const existingFilters = ctx.query?.filters || {};
      const andConditions: any[] = [];

      // Preserve existing $and + other filters
      if (existingFilters.$and) {
        andConditions.push(...existingFilters.$and);
        const { $and, ...rest } = existingFilters;
        if (Object.keys(rest).length) {
          andConditions.push(rest);
        }
      } else if (Object.keys(existingFilters).length) {
        andConditions.push(existingFilters);
      }

      andConditions.push({ removedAt: { $null: true } });
      andConditions.push({ Status: "Active" });

      ctx.query = {
        ...ctx.query,
        filters: {
          $and: andConditions,
        },
      };

      return true;
    },

    async find(ctx, next) {
      // @ts-expect-error Strapi controller typings require two args; we only need ctx for filtering
      this.applyPublicProductFilters(ctx);
      const response = await (super.find as any)(ctx, next);

      return response;
    },

    async findOne(ctx, next) {
      // @ts-expect-error Strapi controller typings require two args; we only need ctx for filtering
      const filtersApplied = this.applyPublicProductFilters(ctx);
      const response: any = await (super.findOne as any)(ctx, next);

      if (!filtersApplied) {
        return response;
      }

      const product = response?.data;
      const status = readProductStatus(product);
      const removedAt = readProductRemovedAt(product);
      if (status !== "Active" || removedAt) {
        return ctx.notFound("Product not found");
      }

      const user = ctx.state.user;
      const isAdmin = isAdminUser(user);
      if (!isAdmin && status === "Active" && product?.id) {
        try {
          const productViewService = strapi.service("api::product-view.product-view") as {
            queueProductView: (productId: number) => Promise<void>;
          };
          void productViewService.queueProductView(product.id);
        } catch (viewError) {
          strapi.log.warn("[Product.findOne] Failed to queue view count increment:", viewError);
        }
      }

      return response;
    },

    /**
     * Search products by query string
     * @param {Object} ctx - The context
     * @returns {Object} The search results
     */
    async search(ctx) {
      try {
        const { q } = ctx.query;

        if (!q) {
          return ctx.badRequest("Search query (q) is required");
        }

        const user = ctx.state.user;
        const isAdmin = isAdminUser(user);
        const bypassCache = shouldBypassEndpointCache(ctx.request?.headers as Record<string, unknown>) || isAdmin;

        const cacheKey = buildCacheKey({
          routeId: "product.search",
          query: ctx.query || {},
          locale: String(ctx.query?.locale || ""),
          authSegment: bypassCache ? "auth" : "anon",
        });

        const payload = await withCache(
          {
            key: cacheKey,
            ttlSec: getCacheTtlFromEnv("CACHE_TTL_PRODUCT_SEARCH_SEC", 20),
            bypass: bypassCache,
            onStatus: (status) => setCacheHeaderIfEnabled(ctx, status),
            shouldCacheValue: (value) => Array.isArray((value as any)?.data),
          },
          async () => {
            const { results, pagination } = await strapi
              .service("api::product.product")
              .search(q, { ...ctx.query, isAdmin });

            const productService: any = strapi.service("api::product.product");
            const resultList = Array.isArray(results) ? results : [];
            return {
              data: resultList.filter((p: any) =>
                productService.hasPublishedStockedVariation(
                  p?.attributes ? { product_variations: p.attributes.product_variations?.data } : p,
                ),
              ),
              meta: { pagination },
            };
          },
        );

        return payload;
      } catch (error) {
        return ctx.badRequest("An error occurred while searching products", {
          error: (error as Error).message,
        });
      }
    },

    /**
     * Lightweight product listing for PLP.
     * Returns only card/filter fields needed by frontend PLP and supports
     * the same query filter structure as /products.
     */
    async plp(ctx, next) {
      try {
        const user = ctx.state.user;
        const isAdmin = isAdminUser(user);
        const bypassCache =
          shouldBypassEndpointCache(ctx.request?.headers as Record<string, unknown>) || isAdmin;

        const cacheKey = buildCacheKey({
          routeId: "product.plp",
          query: ctx.query || {},
          locale: String(ctx.query?.locale || ""),
          authSegment: bypassCache ? "auth" : "anon",
        });

        const payload = await withCache(
          {
            key: cacheKey,
            ttlSec: getCacheTtlFromEnv("CACHE_TTL_PRODUCT_PLP_SEC", 30),
            bypass: bypassCache,
            onStatus: (status) => setCacheHeaderIfEnabled(ctx, status),
            shouldCacheValue: (value) => Array.isArray((value as any)?.data),
          },
          async () => {
            // Reuse existing public filter enforcement for non-admin users.
            // @ts-expect-error Strapi controller typings require two args; we only need ctx for filtering
            this.applyPublicProductFilters(ctx);

            const incomingQuery = ctx.query || {};
            const incomingPagination = (incomingQuery as any)?.pagination || {};
            const page = Math.max(
              1,
              Number.parseInt(String(incomingPagination?.page ?? 1), 10) || 1,
            );
            const pageSize = Math.min(
              60,
              Math.max(1, Number.parseInt(String(incomingPagination?.pageSize ?? 30), 10) || 30),
            );
            const includeMedia = String((incomingQuery as any)?.includeMedia || "false") === "true";

            const { includeMedia: _includeMedia, ...incomingRestQuery } = incomingQuery as any;

            const normalizedQuery = {
              ...incomingRestQuery,
              fields: ["Title", "Slug", "SeenCount", "createdAt"],
              populate: {
                CoverImage: { fields: ["url"] },
                product_main_category: { fields: ["Title", "Slug"] },
                product_variations: {
                  fields: ["Price", "DiscountPrice", "IsPublished"],
                  populate: {
                    product_stock: { fields: ["Count"] },
                    general_discounts: { fields: ["Amount"] },
                    product_variation_color: { fields: ["ColorCode"] },
                  },
                },
                ...(includeMedia
                  ? {
                      Media: {
                        fields: ["url", "mime"],
                        pagination: { limit: 3 },
                      },
                    }
                  : {}),
              },
              pagination: {
                page,
                pageSize,
                withCount: true,
              },
            } as any;

            const previousQuery = ctx.query;
            try {
              ctx.query = normalizedQuery;
              const response = await (super.find as any)(ctx, next);
              return response;
            } finally {
              ctx.query = previousQuery;
            }
          },
        );

        return payload;
      } catch (error) {
        return ctx.badRequest("An error occurred while fetching PLP products", {
          error: (error as Error).message,
        });
      }
    },

    /**
     * Find a product by its slug
     * @param {Object} ctx - The context
     * @returns {Object} The product data
     */
    async findBySlug(ctx) {
      try {
        const { slug } = ctx.params;

        if (!slug) {
          return ctx.badRequest("Slug parameter is required");
        }

        let decodedSlug = slug;
        try {
          decodedSlug = decodeURIComponent(slug);
        } catch {
          decodedSlug = slug;
        }

        strapi.log.info(
          `[Product.findBySlug] Looking up product with slug/ID: "${decodedSlug}" (original: "${slug}")`,
        );

        const user = ctx.state.user;
        const isAdmin = isAdminUser(user);
        const bypassCache = shouldBypassEndpointCache(ctx.request?.headers as Record<string, unknown>) || isAdmin;

        const cacheKey = buildCacheKey({
          routeId: "product.by-slug",
          params: { slug: decodedSlug },
          query: ctx.query || {},
          locale: String(ctx.query?.locale || ""),
          authSegment: bypassCache ? "auth" : "anon",
        });

        const payload = await withCache(
          {
            key: cacheKey,
            ttlSec: getCacheTtlFromEnv("CACHE_TTL_PRODUCT_BY_SLUG_SEC", 60),
            bypass: bypassCache,
            onStatus: (status) => setCacheHeaderIfEnabled(ctx, status),
            shouldCacheValue: (value) => Boolean((value as any)?.data),
          },
          async () => {
            const product = await findProductBySlugInternal(strapi, decodedSlug, isAdmin);
            if (!product) {
              return null;
            }
            return { data: product };
          },
        );

        if (!payload?.data) {
          strapi.log.error(`[Product.findBySlug] Product not found for slug/ID: ${decodedSlug}`);
          return ctx.notFound("Product not found");
        }

        const productData = payload.data;
        const status = readProductStatus(productData);
        const removedAt = readProductRemovedAt(productData);
        if (!isAdmin && (status !== "Active" || removedAt)) {
          return ctx.notFound("Product not found");
        }

        strapi.log.info(
          `[Product.findBySlug] Successfully found product: ${productData.id} (${productData.Title || "N/A"})`,
        );

        if (!isAdmin && status === "Active" && productData?.id) {
          try {
            const productViewService = strapi.service("api::product-view.product-view") as {
              queueProductView: (productId: number) => Promise<void>;
            };
            void productViewService.queueProductView(Number(productData.id));
          } catch (viewError) {
            strapi.log.warn("[Product.findBySlug] Failed to queue view count increment:", viewError);
          }
        }

        return payload;
      } catch (error) {
        strapi.log.error("[Product.findBySlug] Error finding product by slug:", error);
        return ctx.badRequest("An error occurred while finding the product", {
          error: (error as Error).message,
        });
      }
    },
  }),
);
