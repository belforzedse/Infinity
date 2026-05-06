import { Strapi } from "@strapi/strapi";

export const getMyCartHandler = (strapi: Strapi) => async (ctx: any) => {
  const { user } = ctx.state;

  try {
    const cartService = strapi.service("api::cart.cart");
    const cart = await cartService.getUserCart(user.id);

    return {
      data: {
        id: cart.id,
        Status: cart.Status,
        cart_items: cart.cart_items || [],
      },
    };
  } catch (error: any) {
    return ctx.badRequest(error.message, {
      data: {
        success: false,
        error: error.message,
      },
    });
  }
};
