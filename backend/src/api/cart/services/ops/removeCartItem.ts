import type { Strapi } from "@strapi/strapi";

export const removeCartItemOp = async (strapi: Strapi, cartItemId: number) => {
  const cartItem = await strapi.db.query("api::cart-item.cart-item").findOne({
    where: { id: cartItemId },
    populate: { cart: true },
  });
  if (!cartItem) {
    return { success: false, message: "Cart item not found" };
  }

  const cartId = cartItem.cart.id;
  await strapi.entityService.delete("api::cart-item.cart-item", cartItemId);

  const remainingItems = await strapi.db
    .query("api::cart-item.cart-item")
    .count({ where: { cart: cartId } });
  if (remainingItems === 0) {
    await strapi.entityService.update("api::cart.cart", cartId, {
      data: { Status: "Empty" },
    });
  }
  return { success: true };
};
