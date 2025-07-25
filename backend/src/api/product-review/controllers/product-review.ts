/**
 * product-review controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::product-review.product-review",
  ({ strapi }) => ({
    // Create a new product review
    async submitReview(ctx) {
      try {
        const { user } = ctx.state;
        const { productId, rate, content } = ctx.request.body;

        if (!productId || !rate || !content) {
          return ctx.badRequest("Missing required fields");
        }

        // Check if product exists
        const product = await strapi.entityService.findOne(
          "api::product.product",
          productId
        );
        if (!product) {
          return ctx.notFound("Product not found");
        }

        // Check if user has already reviewed this product
        const existingReview = await strapi.db
          .query("api::product-review.product-review")
          .findOne({
            where: {
              user: user.id,
              product: productId,
              removedAt: null,
            },
          });

        let review;
        const now = new Date();

        if (existingReview) {
          // Update existing review
          review = await strapi.entityService.update(
            "api::product-review.product-review",
            existingReview.id,
            {
              data: {
                Rate: rate,
                Content: content,
                updatedAt: now,
              },
            }
          );
          return { ...review, isUpdated: true };
        } else {
          // Create new review
          review = await strapi.entityService.create(
            "api::product-review.product-review",
            {
              data: {
                user: user.id,
                product: productId,
                Rate: rate,
                Content: content,
                Date: now,
                Status: "Need for Review",
              },
            }
          );
          return { ...review, isNew: true };
        }
      } catch (error) {
        return ctx.badRequest("An error occurred while submitting the review", {
          error: error.message,
        });
      }
    },

    // Get all reviews for the current user
    async getUserReviews(ctx) {
      try {
        const { user } = ctx.state;

        const { results: reviews, pagination } = await strapi
          .service("api::product-review.product-review")
          .find({
            filters: {
              user: user.id,
              removedAt: null,
            },
            populate: ["product"],
            sort: { createdAt: "desc" },
          });

        return { data: reviews, meta: { pagination } };
      } catch (error) {
        return ctx.badRequest("An error occurred while fetching user reviews", {
          error: error.message,
        });
      }
    },
  })
);
