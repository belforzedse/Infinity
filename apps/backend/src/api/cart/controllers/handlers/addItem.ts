import { Strapi } from "@strapi/strapi";

export const addItemHandler = (strapi: Strapi) => async (ctx: any) => {
  const { user } = ctx.state;
  const { productVariationId, count } = ctx.request.body;

  try {
    if (!productVariationId) {
      return ctx.badRequest("Product variation ID is required", {
        data: { success: false, error: "Product variation ID is required" },
      });
    }
    if (!count || count < 1) {
      return ctx.badRequest("Count must be a positive number", {
        data: { success: false, error: "Count must be a positive number" },
      });
    }

    const cartService = strapi.service("api::cart.cart");
    const cart = await cartService.getUserCart(user.id);
    const result = await cartService.addCartItem(
      cart.id,
      productVariationId,
      count
    );

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
