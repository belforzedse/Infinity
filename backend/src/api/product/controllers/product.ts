/**
 * product controller
 */

import { factories } from "@strapi/strapi";

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
          error: error.message,
        });
      }
    },
  })
);
