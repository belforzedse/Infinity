import { Strapi } from "@strapi/strapi";

export const updateItemHandler = (strapi: Strapi) => async (ctx: any) => {
  const { user } = ctx.state;
  const { cartItemId, count } = ctx.request.body;

  try {
    if (!cartItemId) {
      return ctx.badRequest("Cart item ID is required", {
        data: { success: false, error: "Cart item ID is required" },
      });
    }

    // If count is less than 1, remove the cart item instead of updating
    if (!count || count < 1) {
      const cartService = strapi.service("api::cart.cart");
      const result = await cartService.removeCartItem(cartItemId);
      if (!result.success) {
        return ctx.badRequest(result.message, {
          data: { success: false, error: result.message },
        });
      }
      return { data: { message: "Cart item removed successfully" } };
    }

    // Verify cart item belongs to user
    const cartItem = await strapi.db.query("api::cart-item.cart-item").findOne({
      where: { id: cartItemId, cart: { user: { id: user.id } } },
      populate: { product_variation: { populate: { product_stock: true } } },
    });

    if (!cartItem) {
      return ctx.forbidden(
        "You do not have permission to update this cart item",
        {
          data: {
            success: false,
            error: "You do not have permission to update this cart item",
          },
        }
      );
    }

    if (cartItem.product_variation?.product_stock?.Count < count) {
      return ctx.badRequest("Not enough stock", {
        data: { success: false, error: "Not enough stock" },
      });
    }

    const cartService = strapi.service("api::cart.cart");
    const result = await cartService.updateCartItem(cartItemId, count);
    if (!result.success) {
      return ctx.badRequest(result.message, {
        data: { success: false, error: result.message },
      });
    }
    return { data: result.data };
  } catch (error: any) {
    return ctx.badRequest(error.message, {
      data: { success: false, error: error.message },
    });
  }
};
