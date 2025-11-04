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
              product: {
                fields: ["id", "Title", "SKU", "Weight"],
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

  // Clean up cart items with missing product data to prevent checkout errors
  if (cart.cart_items && cart.cart_items.length > 0) {
    const validItems = cart.cart_items.filter((item: any) => {
      const hasValidVariation = item.product_variation && item.product_variation.id;
      const hasValidProduct = item.product_variation?.product && item.product_variation.product.id;

      if (!hasValidVariation || !hasValidProduct) {
        strapi.log.warn(`Filtering out invalid cart item ${item.id}: missing product_variation or product`);
      }

      return hasValidVariation && hasValidProduct;
    });

    cart.cart_items = validItems;
  }

  return cart;
};
