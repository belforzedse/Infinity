import type { Strapi } from "@strapi/strapi";

export const updateCartItemOp = async (
  strapi: Strapi,
  cartItemId: number,
  count: number
) => {
  const cartItem = await strapi.db.query("api::cart-item.cart-item").findOne({
    where: { id: cartItemId },
    populate: { product_variation: { populate: { product_stock: true } } },
  });

  if (!cartItem) {
    return { success: false, message: "Cart item not found" };
  }

  if (
    !cartItem.product_variation?.product_stock ||
    cartItem.product_variation.product_stock.Count < count
  ) {
    return { success: false, message: "Insufficient stock" };
  }

  const price = cartItem.product_variation.Price || 0;
  const updatedItem = await strapi.entityService.update(
    "api::cart-item.cart-item",
    cartItemId,
    {
      data: { Count: count, Sum: count * price },
    }
  );

  return { success: true, data: updatedItem };
};
