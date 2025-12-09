/**
 * product service
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreService(
  "api::product.product",
  ({ strapi }) => ({
    /**
     * Check if a product has at least one published variation with stock > 0
     */
    hasPublishedStockedVariation(product: any): boolean {
      const variations =
        product?.product_variations ||
        product?.attributes?.product_variations ||
        [];

      if (!Array.isArray(variations)) return false;

      return variations.some((variation: any) => {
        const attrs = variation?.attributes || variation;
        if (attrs?.IsPublished !== true) return false;

        const stock =
          attrs?.product_stock?.data?.attributes?.Count ??
          attrs?.product_stock?.Count ??
          attrs?.product_stock?.count;

        return typeof stock === "number" && stock > 0;
      });
    },

    /**
     * Search for products based on a query string
     * @param {string} query - The search query
     * @param {Object} params - Additional query parameters including isAdmin flag
     * @returns {Object} The search results and pagination
     */
    async search(query, params: { page?: number; pageSize?: number; isAdmin?: boolean } = {}) {
      const { page = 1, pageSize = 10, isAdmin = false } = params;
      const start = (page - 1) * pageSize;
      const limit = parseInt(pageSize.toString());

      // Create a search filter for product name, description, etc.
      // Exclude trashed products (removedAt should be null)
      // Only include Active products for non-admin users (exclude draft/InActive products)
      const filterConditions: any[] = [
        {
          $or: [
            { Title: { $containsi: query } },
            { Description: { $containsi: query } },
          ],
        },
        { removedAt: { $null: true } },
      ];

      // Only filter by Active status for non-admin users
      // Admins can see all products including drafts
      if (!isAdmin) {
        filterConditions.push({ Status: "Active" });
      }

      const filters: any = {
        $and: filterConditions,
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
        // Filter out products with no published & stocked variations
        results: results.filter((p: any) =>
          this.hasPublishedStockedVariation(
            p?.attributes ? { product_variations: p.attributes.product_variations?.data } : p
          )
        ),
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
