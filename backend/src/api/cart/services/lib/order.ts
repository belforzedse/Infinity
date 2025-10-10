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
  deliveryAddressId?: number,
  trx?: any
) => {
  // Validate cart items before proceeding
  if (!cart.cart_items || cart.cart_items.length === 0) {
    throw new Error("CART_EMPTY: Cannot create order from empty cart");
  }

  // Pre-validate all items have required data
  for (const item of cart.cart_items) {
    const variation = item.product_variation;
    if (!variation) {
      throw new Error(`INVALID_ITEM: Cart item ${item.id} missing product variation`);
    }
    if (!variation.product?.Title) {
      throw new Error(`MISSING_PRODUCT_TITLE: Product variation ${variation.id} missing title`);
    }
    if (!variation.product?.SKU) {
      throw new Error(`MISSING_PRODUCT_SKU: Product variation ${variation.id} missing SKU`);
    }
    if (!variation.Price || Number(variation.Price) < 0) {
      throw new Error(`INVALID_PRICE: Product variation ${variation.id} has invalid price`);
    }
  }

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

  // Use transaction context if provided
  const entityServiceOptions: any = { data: orderData };
  if (trx) {
    entityServiceOptions.data = { ...orderData, publishedAt: null };
  }

  const order = await strapi.db.query("api::order.order").create({
    data: orderData,
    ...(trx ? { transacting: trx } : {}),
  });

  let subtotal = 0;
  const createdItems = [];

  for (const item of cart.cart_items) {
    const variation = item.product_variation;
    const itemPrice = Number(variation?.Price || 0);
    const itemCount = Number(item?.Count || 0);
    subtotal += itemPrice * itemCount;

    try {
      const orderItem = await strapi.db.query("api::order-item.order-item").create({
        data: {
          order: order.id,
          product_variation: variation.id,
          Count: item.Count,
          PerAmount: itemPrice,
          ProductTitle: variation.product?.Title,
          ProductSKU: variation.product?.SKU,
          product_color: variation.product_variation_color?.id || null,
          product_size: variation.product_variation_size?.id || null,
          product_variation_model: variation.product_variation_model?.id || null,
        },
        ...(trx ? { transacting: trx } : {}),
      });
      createdItems.push(orderItem);
    } catch (error: any) {
      strapi.log.error("Failed to create order item:", {
        itemId: item.id,
        variationId: variation.id,
        error: error.message,
      });
      throw new Error(`ORDER_ITEM_CREATION_FAILED: ${error.message}`);
    }

    // Note: Do NOT decrement stock here. Stock will be decremented after
    // successful payment settlement in the order controller.
  }

  return { order, subtotal, createdItems };
};
