import type { Strapi } from "@strapi/strapi";

export const checkCartStockOp = async (strapi: Strapi, userId: number) => {
  const cart = await strapi.service("api::cart.cart").getUserCart(userId);
  if (!cart.cart_items || cart.cart_items.length === 0) {
    return { success: true, valid: true, message: "Cart is empty", cart };
  }

  const adjustments: any[] = [];
  const removals: any[] = [];

  for (const item of cart.cart_items) {
    const variation = item.product_variation;
    const product = variation?.product;

    // Check if product is soft-deleted or inactive
    if (product?.removedAt || product?.Status === "InActive") {
      await strapi.service("api::cart.cart").removeCartItem(item.id);
      removals.push({
        cartItemId: item.id,
        productVariationId: variation?.id,
        productTitle: product?.Title,
        message: "Product is no longer available, item removed from cart",
        reason: product?.removedAt ? "soft_deleted" : "inactive",
      });
      continue;
    }

    // Check if variation is unpublished
    if (variation?.IsPublished === false) {
      await strapi.service("api::cart.cart").removeCartItem(item.id);
      removals.push({
        cartItemId: item.id,
        productVariationId: variation?.id,
        productTitle: product?.Title,
        message:
          "Product variation is no longer available, item removed from cart",
        reason: "unpublished_variation",
      });
      continue;
    }

    if (!item.product_variation?.product_stock) {
      await strapi.service("api::cart.cart").removeCartItem(item.id);
      removals.push({
        cartItemId: item.id,
        productVariationId: item.product_variation?.id,
        message:
          "Product stock information not available, item removed from cart",
      });
      continue;
    }
    const available = item.product_variation.product_stock.Count;
    const requested = item.Count;
    if (available === 0) {
      await strapi.service("api::cart.cart").removeCartItem(item.id);
      removals.push({
        cartItemId: item.id,
        productVariationId: item.product_variation.id,
        requested,
        available: 0,
        message: "Product is out of stock, item removed from cart",
      });
    } else if (available < requested) {
      await strapi.service("api::cart.cart").updateCartItem(item.id, available);
      adjustments.push({
        cartItemId: item.id,
        productVariationId: item.product_variation.id,
        requested,
        available,
        newQuantity: available,
        message: `Quantity reduced from ${requested} to ${available} due to limited stock`,
      });
    }
  }

  const updatedCart = await strapi
    .service("api::cart.cart")
    .getUserCart(userId);
  const cartIsEmpty =
    !updatedCart.cart_items || updatedCart.cart_items.length === 0;
  return {
    success: true,
    valid: cartIsEmpty || (removals.length === 0 && adjustments.length === 0),
    cartIsEmpty,
    itemsRemoved: removals.length > 0 ? removals : undefined,
    itemsAdjusted: adjustments.length > 0 ? adjustments : undefined,
    cart: updatedCart,
  };
};
