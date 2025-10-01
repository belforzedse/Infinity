import type { Strapi } from "@strapi/strapi";

export const getOrCreateUserCart = async (strapi: Strapi, userId: number) => {
  let cart = await strapi.db.query("api::cart.cart").findOne({
    where: { user: userId },
    populate: {
      cart_items: {
        populate: {
          product_variation: {
            populate: {
              product_stock: true,
              product_variation_color: true,
              product_variation_size: true,
              product_variation_model: true,
              general_discounts: true,
              product: {
                fields: ["Title", "SKU", "Weight"],
                populate: {
                  CoverImage: true,
                  product_main_category: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await strapi.entityService.create("api::cart.cart", {
      data: {
        user: userId,
        Status: "Empty",
      },
    });
  }

  return cart;
};
