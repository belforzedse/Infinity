import { Strapi } from "@strapi/strapi";

/**
 * Shipping preview calls Anipo which is now fully disabled.
 * Keep the handler but short-circuit so the endpoint does nothing.
 */
export const shippingPreviewHandler = (strapi: Strapi) => async (ctx: any) => {
  strapi.log.warn(
    "[anipo] shipping-preview endpoint disabled (no automatic Anipo lookups)"
  );
  ctx.body = {
    success: true,
    shipping: null,
    message: "Shipping preview disabled",
  };
};

/*
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

// Previous implementation kept for reference but fully disabled:
// export const shippingPreviewHandler = (strapi: Strapi) => async (ctx: any) => {
//   ...
// };
*/
