import type { Strapi } from "@strapi/strapi";

export const addCartItemOp = async (
  strapi: Strapi,
  cartId: number,
  productVariationId: number,
  count: number = 1
) => {
  const existingItem = await strapi.db
    .query("api::cart-item.cart-item")
    .findOne({
      where: { cart: cartId, product_variation: productVariationId },
    });

  const productVariation = await strapi.db
    .query("api::product-variation.product-variation")
    .findOne({
      where: { id: productVariationId },
      populate: { product: true, product_stock: true },
    });

  if (
    !productVariation?.product_stock ||
    productVariation.product_stock.Count < count
  ) {
    return { success: false, message: "Insufficient stock" };
  }

  const price = productVariation.Price || 0;

  if (existingItem) {
    const newCount = existingItem.Count + count;
    if (productVariation.product_stock.Count < newCount) {
      return {
        success: false,
        message: "Insufficient stock for requested quantity",
      };
    }
    const updatedItem = await strapi.entityService.update(
      "api::cart-item.cart-item",
      existingItem.id,
      { data: { Count: newCount, Sum: newCount * price } }
    );
    return { success: true, data: updatedItem };
  }

  const newItem = await strapi.entityService.create(
    "api::cart-item.cart-item",
    {
      data: {
        cart: cartId,
        product_variation: productVariationId,
        Count: count,
        Sum: count * price,
      },
    }
  );

  const cart = await strapi.db
    .query("api::cart.cart")
    .findOne({ where: { id: cartId } });
  if (cart?.Status === "Empty") {
    await strapi.entityService.update("api::cart.cart", cartId, {
      data: { Status: "Pending" },
    });
  }

  return { success: true, data: newItem };
};
