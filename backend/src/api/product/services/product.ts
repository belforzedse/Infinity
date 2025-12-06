/**
 * product service
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreService(
  "api::product.product",
  ({ strapi }) => ({
    /**
     * Search for products based on a query string
     * @param {string} query - The search query
     * @param {Object} params - Additional query parameters
     * @returns {Object} The search results and pagination
     */
    async search(query, params: { page?: number; pageSize?: number } = {}) {
      const { page = 1, pageSize = 10 } = params;
      const start = (page - 1) * pageSize;
      const limit = parseInt(pageSize.toString());

      // Create a search filter for product name, description, etc.
      // Exclude trashed products (removedAt should be null)
      // Only include Active products (exclude draft/InActive products)
      const filters: any = {
        $and: [
          {
            $or: [
              { Title: { $containsi: query } },
              { Description: { $containsi: query } },
            ],
          },
          { removedAt: { $null: true } },
          { Status: "Active" },
        ],
      };

      // Find products matching the search query with pagination
      // Include Slug field for SEO-friendly URLs
      const [results, total] = await Promise.all([
        strapi.entityService.findMany("api::product.product", {
          filters,
          fields: ["id", "Title", "Slug", "Description", "Status", "AverageRating", "RatingCount", "createdAt", "updatedAt"],
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
          sort: { createdAt: "desc" },
          limit,
          offset: start,
        }),
        strapi.db.query("api::product.product").count({ where: filters }),
      ]);

      return {
        results,
        pagination: {
          page: parseInt(page.toString()),
          pageSize: limit,
          pageCount: Math.ceil(total / limit),
          total,
        },
      };
    },
  })
);
