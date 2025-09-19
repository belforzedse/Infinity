import { Strapi } from "@strapi/strapi";

function computeTotalWeight(cart: any): number {
  let total = 0;
  for (const item of cart?.cart_items || []) {
    const product = item?.product_variation?.product;
    const weight = Number(product?.Weight ?? 100) || 100;
    const count = Number(item?.Count || 0);
    total += weight * count;
  }
  return total > 0 ? total : 100;
}

export const shippingPreviewHandler = (strapi: Strapi) => async (ctx: any) => {
  const { user } = ctx.state;
  const { addressId, shippingId } = ctx.request.body || {};

  try {
    if (!addressId) {
      return ctx.badRequest("addressId is required");
    }
    if (!shippingId) {
      return ctx.badRequest("shippingId is required");
    }

    // If excluded method (id=4), return zero
    if (Number(shippingId) === 4) {
      ctx.body = { success: true, shipping: 0 };
      return;
    }

    // Load cart with product weights
    const cartService = strapi.service("api::cart.cart");
    const cart = await cartService.getUserCart(user.id);
    if (!cart?.cart_items?.length) {
      return ctx.badRequest("Cart is empty");
    }

    // Load address with city/province
    const address = await strapi.entityService.findOne(
      "api::local-user-address.local-user-address",
      Number(addressId),
      {
        populate: {
          shipping_city: { populate: { shipping_province: true } },
        },
      }
    );
    if (!address?.shipping_city?.Code) {
      return ctx.badRequest("Address city code is missing");
    }

    // Compute sum from cart subtotal (prefer DiscountPrice when available)
    let subtotal = 0;
    for (const item of cart.cart_items) {
      const variation = item?.product_variation;
      const price = Number(
        (variation?.DiscountPrice ?? variation?.Price ?? 0) as number
      );
      const count = Number(item?.Count || 0);
      subtotal += price * count;
    }

    const weight = computeTotalWeight(cart);
    const cityCode = Number(address.shipping_city.Code);

    const anipo = strapi.service("api::shipping.anipo") as any;
    const result = await anipo.barcodePrice({
      cityCode,
      weight,
      sum: subtotal,
      isnonstandard: 0,
      smsservice: 0,
    });

    if (!result.ok) {
      return ctx.badRequest("Failed to fetch shipping price", {
        data: { success: false, error: result.error },
      });
    }

    ctx.body = { success: true, shipping: result.price || 0, weight };
  } catch (error: any) {
    return ctx.badRequest("Error computing shipping preview", {
      data: { success: false, error: error?.message },
    });
  }
};
