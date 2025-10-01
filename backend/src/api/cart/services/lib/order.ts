import type { Strapi } from "@strapi/strapi";

type OrderStatus =
  | "Paying"
  | "Started"
  | "Shipment"
  | "Done"
  | "Returned"
  | "Cancelled";
type OrderType = "Manual" | "Automatic";

export const resolveShippingCost = async (
  strapi: Strapi,
  shippingId?: number,
  providedCost?: number
) => {
  // If excluded method (id=4), price is 0 regardless
  if (shippingId && Number(shippingId) === 4) return 0;

  const cost = providedCost ? parseInt(String(providedCost)) : 0;
  if (cost || !shippingId) return cost;
  const shipping = await strapi.entityService.findOne(
    "api::shipping.shipping",
    shippingId
  );
  return shipping?.Price || 0;
};

export const createOrderAndItems = async (
  strapi: Strapi,
  userId: number,
  cart: any,
  finalShippingCost: number,
  shippingId?: number,
  description?: string,
  note?: string,
  deliveryAddressId?: number
) => {
  const orderData = {
    user: userId,
    Status: "Paying" as OrderStatus,
    Date: new Date(),
    Type: "Automatic" as OrderType,
    shipping: shippingId,
    ShippingCost: finalShippingCost,
    Description: description || "",
    Note: note || "",
    delivery_address: deliveryAddressId || undefined,
  };

  const order = await strapi.entityService.create("api::order.order", {
    data: orderData,
  });

  let subtotal = 0;
  for (const item of cart.cart_items) {
    const variation = item.product_variation;
    const itemPrice = Number(variation?.Price || 0);
    const itemCount = Number(item?.Count || 0);
    subtotal += itemPrice * itemCount;

    await strapi.entityService.create("api::order-item.order-item", {
      data: {
        order: order.id,
        product_variation: variation.id,
        Count: item.Count,
        PerAmount: itemPrice,
        ProductTitle: variation.product?.Title || "Unknown Product",
        ProductSKU: variation.product?.SKU || "Unknown SKU",
        product_color: variation.product_variation_color?.id,
        product_size: variation.product_variation_size?.id,
        product_variation_model: variation.product_variation_model?.id,
      },
    });

    // Note: Do NOT decrement stock here. Stock will be decremented after
    // successful payment settlement in the order controller.
  }

  return { order, subtotal };
};
