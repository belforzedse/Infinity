/**
 * product-view service
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreService("api::product-view.product-view", ({ strapi }) => ({
  /**
   * Increment product view count
   * Creates a new view record and updates the product's SeenCount with views in last 24 hours
   * @param productId - The product ID to increment view for
   * @returns The updated seen count for the product
   */
  async incrementProductView(productId: number): Promise<number> {
    try {
      // Create new view record with current timestamp
      await strapi.entityService.create("api::product-view.product-view", {
        data: {
          product: productId,
          viewedAt: new Date(),
        },
      });

      // Calculate 24 hours ago
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // Count views in last 24 hours
      const count = await strapi.entityService.count("api::product-view.product-view", {
        filters: {
          product: productId,
          viewedAt: {
            $gte: twentyFourHoursAgo.toISOString(),
          },
        },
      });

      // Update product's SeenCount
      await strapi.entityService.update("api::product.product", productId, {
        data: {
          SeenCount: count,
        },
      });

      return count;
    } catch (error) {
      strapi.log.error("[ProductView] Error incrementing product view:", error);
      // Return current count if update fails
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
}));
