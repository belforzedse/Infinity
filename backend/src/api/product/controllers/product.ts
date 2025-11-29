/**
 * product controller
 */

import { factories } from "@strapi/strapi";

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

export default factories.createCoreController(
  "api::product.product",
  ({ strapi }) => ({
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

        // Call the search service with the query parameter
        const { results, pagination } = await strapi
          .service("api::product.product")
          .search(q, ctx.query);

        return {
          data: results,
          meta: { pagination },
        };
      } catch (error) {
        return ctx.badRequest("An error occurred while searching products", {
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

        // Decode the slug in case it contains Persian characters
        // Handle both encoded and already-decoded slugs
        let decodedSlug = slug;
        try {
          decodedSlug = decodeURIComponent(slug);
        } catch (e) {
          // If decoding fails, use the slug as-is (might already be decoded)
          decodedSlug = slug;
        }

        // Log for debugging
        strapi.log.info(`[Product.findBySlug] Looking up product with slug/ID: "${decodedSlug}" (original: "${slug}")`);

        // Find product by slug - try exact match first
        let products = await strapi.entityService.findMany("api::product.product", {
          filters: {
            Slug: decodedSlug,
            removedAt: { $null: true }, // Exclude trashed products
          },
          populate: PRODUCT_POPULATE,
          pagination: { limit: 1 },
        });

        let product = (products as unknown[])[0];

        // If not found, try using raw SQL query for better Persian character handling
        if (!product) {
          strapi.log.info(`[Product.findBySlug] No exact match for slug: "${decodedSlug}", trying raw SQL query...`);
          try {
            const knex = strapi.db.connection;
            const rawProducts = await knex('products')
              .where('slug', decodedSlug)
              .whereNull('removed_at')
              .limit(1);

            if (rawProducts.length > 0) {
              const productId = rawProducts[0].id;
              const foundProducts = await strapi.entityService.findMany("api::product.product", {
                filters: { id: productId },
                populate: PRODUCT_POPULATE,
                pagination: { limit: 1 },
              });
              product = (foundProducts as unknown[])[0];
              if (product) {
                strapi.log.info(`[Product.findBySlug] Found product via raw SQL query: ${productId}`);
              }
            }
          } catch (sqlError) {
            strapi.log.warn(`[Product.findBySlug] Raw SQL query failed:`, sqlError);
          }
        }

        if (!product) {
          strapi.log.info(`[Product.findBySlug] No product found with slug: "${decodedSlug}", trying ID fallback...`);

          // Try to find by ID as fallback for backwards compatibility
          // Use findMany to ensure consistent response format with slug lookup
          const idMatch = decodedSlug.match(/^\d+$/);
          if (idMatch) {
            const productId = parseInt(decodedSlug, 10);
            strapi.log.info(`[Product.findBySlug] Attempting ID-based lookup for product ID: ${productId}`);
            const productsById = await strapi.entityService.findMany("api::product.product", {
              filters: {
                id: productId,
                removedAt: { $null: true }, // Exclude trashed products
              },
              populate: PRODUCT_POPULATE,
              pagination: { limit: 1 },
            });

            const productById = (productsById as unknown[])[0];

            if (productById) {
              strapi.log.info(`[Product.findBySlug] Found product by ID: ${productId}`);
              return {
                data: productById,
              };
            } else {
              strapi.log.warn(`[Product.findBySlug] Product with ID ${productId} not found or is trashed`);
            }
          } else {
            strapi.log.warn(`[Product.findBySlug] Slug "${decodedSlug}" is not numeric, cannot use ID fallback`);
          }

          strapi.log.error(`[Product.findBySlug] Product not found for slug/ID: ${decodedSlug}`);
          return ctx.notFound("Product not found");
        }

        const productData = product as { id: number; Title?: string };
        strapi.log.info(`[Product.findBySlug] Successfully found product: ${productData.id} (${productData.Title || 'N/A'})`);
        return {
          data: product,
        };
      } catch (error) {
        strapi.log.error("[Product.findBySlug] Error finding product by slug:", error);
        return ctx.badRequest("An error occurred while finding the product", {
          error: (error as Error).message,
        });
      }
    },
  })
);
