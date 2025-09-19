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
      strapi.log.warn("[anipo] shipping-preview missing addressId", {
        userId: user?.id,
        shippingId,
      });
      return ctx.badRequest("addressId is required");
    }
    if (!shippingId) {
      strapi.log.warn("[anipo] shipping-preview missing shippingId", {
        userId: user?.id,
        addressId,
      });
      return ctx.badRequest("shippingId is required");
    }

    // If excluded method (id=4), return zero
    if (Number(shippingId) === 4) {
      strapi.log.info("[anipo] shipping-preview excluded shippingId=4 → 0", {
        userId: user?.id,
        addressId,
        shippingId,
      });
      ctx.body = { success: true, shipping: 0 };
      return;
    }

    // Load cart with product weights
    const cartService = strapi.service("api::cart.cart");
    const cart = await cartService.getUserCart(user.id);
    if (!cart?.cart_items?.length) {
      strapi.log.warn("[anipo] shipping-preview empty cart", {
        userId: user?.id,
      });
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
      strapi.log.warn(
        "[anipo] shipping-preview city code missing for address",
        {
          userId: user?.id,
          addressId,
          shippingId,
        }
      );
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
    const anipoPayload = {
      cityCode,
      weight,
      sum: subtotal,
      isnonstandard: 0 as 0,
      smsservice: 0 as 0,
    };
    strapi.log.info("[anipo] shipping-preview request", {
      userId: user?.id,
      addressId,
      shippingId,
      payload: anipoPayload,
    });
    const result = await anipo.barcodePrice(anipoPayload);

    if (!result.ok) {
      strapi.log.error("[anipo] shipping-preview response error", {
        userId: user?.id,
        addressId,
        shippingId,
        error: result.error,
      });
      return ctx.badRequest("Failed to fetch shipping price", {
        data: { success: false, error: result.error },
      });
    }

    strapi.log.info("[anipo] shipping-preview response ok", {
      userId: user?.id,
      addressId,
      shippingId,
      price: result.price,
    });
    ctx.body = { success: true, shipping: result.price || 0, weight };
  } catch (error: any) {
    strapi.log.error("[anipo] shipping-preview exception", {
      userId: user?.id,
      addressId,
      shippingId,
      error: error?.message,
    });
    return ctx.badRequest("Error computing shipping preview", {
      data: { success: false, error: error?.message },
    });
  }
};
