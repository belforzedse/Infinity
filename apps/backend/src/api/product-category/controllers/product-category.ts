// @ts-nocheck
/**
 * product-category controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::product-category.product-category",
  ({ strapi }) => ({
    /**
     * Delete a category and reassign its products to a target category.
     * Requires targetCategoryId in request body.
     * Blocks deletion if category has child categories.
     */
    async deleteWithReassign(ctx) {
      const id = Number(ctx.params.id);
      const { targetCategoryId } = ctx.request.body ?? {};

      if (!Number.isInteger(id) || id <= 0) {
        return ctx.badRequest("Invalid category ID");
      }

      const targetId =
        typeof targetCategoryId === "number"
          ? targetCategoryId
          : Number(targetCategoryId);
      if (!Number.isInteger(targetId) || targetId <= 0) {
        return ctx.badRequest("targetCategoryId is required and must be a positive integer");
      }

      if (id === targetId) {
        return ctx.badRequest("Target category must differ from the category being deleted");
      }

      const category = await strapi.entityService.findOne(
        "api::product-category.product-category",
        id,
        { populate: ["children"] },
      );

      if (!category) {
        return ctx.notFound("Category not found");
      }

      const targetCategory = await strapi.entityService.findOne(
        "api::product-category.product-category",
        targetId,
      );

      if (!targetCategory) {
        return ctx.badRequest("Target category not found");
      }

      const children = (category as { children?: unknown[] }).children;
      if (children && Array.isArray(children) && children.length > 0) {
        return ctx.badRequest(
          "امکان حذف دسته‌بندی دارای فرزند وجود ندارد. ابتدا دسته‌های فرزند را حذف کنید.",
        );
      }

      let reassignedCount = 0;

      const productsWithMain = await strapi.db.query("api::product.product").findMany({
        where: { product_main_category: id },
        select: ["id"],
      });

      for (const p of productsWithMain) {
        await strapi.entityService.update("api::product.product", p.id, {
          data: { product_main_category: targetId },
        });
        reassignedCount += 1;
      }

      const productsWithOther = await strapi.db.query("api::product.product").findMany({
        where: {
          product_other_categories: {
            id: id,
          },
        },
        populate: ["product_other_categories"],
      });

      for (const p of productsWithOther) {
        const others = (p as { product_other_categories?: { id: number }[] })
          .product_other_categories ?? [];
        const newOthers = others.filter((c) => c.id !== id).map((c) => c.id);
        await strapi.entityService.update("api::product.product", p.id, {
          data: { product_other_categories: newOthers },
        });
      }

      const contents = await strapi.db.query(
        "api::product-category-content.product-category-content",
      ).findMany({
        where: { product_category: id },
        select: ["id"],
      });

      for (const c of contents) {
        await strapi.entityService.delete(
          "api::product-category-content.product-category-content",
          c.id,
        );
      }

      await strapi.entityService.delete(
        "api::product-category.product-category",
        id,
      );

      return {
        data: { success: true, reassignedCount },
      };
    },
  }),
);
