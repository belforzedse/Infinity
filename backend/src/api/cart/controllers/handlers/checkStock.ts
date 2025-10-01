import { Strapi } from "@strapi/strapi";

export const checkStockHandler = (strapi: Strapi) => async (ctx: any) => {
  const { user } = ctx.state;
  try {
    const cartService = strapi.service("api::cart.cart");
    const result = await cartService.checkCartStock(user.id);
    return { data: result };
  } catch (error: any) {
    return ctx.badRequest(error.message, {
      data: { success: false, error: error.message },
    });
  }
};
