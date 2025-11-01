/**
 * product-like controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::product-like.product-like",
  ({ strapi }) => ({
    async toggleFavorite(ctx) {
      try {
        const { productId } = ctx.request.body;

        // Validation
        if (!productId) {
          return ctx.badRequest("Product ID is required");
        }

        // Get user from context (set by authentication middleware)
        const user = ctx.state.user;

        if (!user) {
          return ctx.unauthorized("Authentication required");
        }

        // Check if product exists
        const product = await strapi.entityService.findOne(
          "api::product.product",
          productId
        );

        if (!product) {
          return ctx.notFound("Product not found");
        }

        // Check if favorite already exists
        const existingLike = await strapi.db
          .query("api::product-like.product-like")
          .findOne({
            where: {
              user: user.id,
              product: productId,
            },
          });

        // If favorite exists, remove it (toggle off)
        if (existingLike) {
          await strapi.entityService.delete(
            "api::product-like.product-like",
            existingLike.id
          );
          return ctx.send({
            success: true,
            message: "Product removed from favorites",
            isFavorite: false,
          });
        }

        // Otherwise, add it as a favorite (toggle on)
        await strapi.entityService.create("api::product-like.product-like", {
          data: {
            user: user.id,
            product: productId,
          },
        });

        return ctx.send({
          success: true,
          message: "Product added to favorites",
          isFavorite: true,
        });
      } catch (error) {
        strapi.log.error(error);
        return ctx.internalServerError("An error occurred");
      }
    },

    async getUserLikes(ctx) {
      try {
        // Get user from context (set by authentication middleware)
        const user = ctx.state.user;

        if (!user) {
          return ctx.unauthorized("Authentication required");
        }

        // Query parameters for pagination
        const { page = 1, pageSize = 25 } = ctx.query;
        const start = (page - 1) * pageSize;
        const limit = parseInt(pageSize);

        // Find all product likes for this user with expanded product data
        const [productLikes, count] = await Promise.all([
          strapi.db.query("api::product-like.product-like").findMany({
            where: {
              user: user.id,
            },
            populate: {
              product: {
                populate: {
                  CoverImage: true,
                  product_main_category: true,
                  product_tags: true,
                  product_variations: {
                    populate: {
                      product_variation_color: true,
                      product_variation_size: true,
                      product_variation_model: true,
                      product_stock: true,
                    },
                  },
                },
              },
            },
            limit,
            offset: start,
          }),
          strapi.db.query("api::product-like.product-like").count({
            where: {
              user: user.id,
            },
          }),
        ]);

        return ctx.send({
          data: productLikes,
          meta: {
            pagination: {
              page: parseInt(page),
              pageSize: limit,
              pageCount: Math.ceil(count / limit),
              total: count,
            },
          },
        });
      } catch (error) {
        strapi.log.error(error);
        return ctx.internalServerError("An error occurred");
      }
    },
  })
);
