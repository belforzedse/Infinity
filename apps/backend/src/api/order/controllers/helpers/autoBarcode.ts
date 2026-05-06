import type { Strapi } from "@strapi/strapi";

export async function autoGenerateBarcodeIfEligible(
  strapi: Strapi,
  orderId: number
) {
  try {
    if (!orderId || isNaN(Number(orderId))) return;

    const order: any = await strapi.entityService.findOne(
      "api::order.order",
      Number(orderId),
      {
        populate: {
          user: true,
          shipping: true,
          delivery_address: {
            populate: {
              shipping_city: { populate: { shipping_province: true } },
            },
          },
          order_items: {
            populate: {
              product_variation: { populate: { product: true } },
            },
          },
        },
      }
    );

    if (!order) return;
    if (order?.ShippingBarcode) return;

    const shippingId =
      typeof order?.shipping === "object"
        ? order?.shipping?.id
        : order?.shipping;
    if (Number(shippingId) === 4) return;

    let weight = 0;
    for (const it of order?.order_items || []) {
      const product = it?.product_variation?.product as any;
      const w = Number(product?.Weight ?? 100) || 100;
      const c = Number(it?.Count || 0);
      weight += w * c;
    }
    if (weight <= 0) weight = 100;

    const address = order?.delivery_address as any;
    const cityName = address?.shipping_city?.Title || "";
    const provinceName = address?.shipping_city?.shipping_province?.Title || "";
    const provinceCode = address?.shipping_city?.shipping_province?.Code || "";

    if (!provinceCode || !cityName) return;

    let sum = 0;
    for (const it of order?.order_items || []) {
      const per = Number(it?.PerAmount || 0);
      const c = Number(it?.Count || 0);
      sum += per * c;
    }
    sum += Number(order?.ShippingCost || 0);

    const anipo = strapi.service("api::shipping.anipo") as any;
    const res = await anipo.getBarcode({
      orderId: Number(order.id),
      provinceCode,
      provinceName,
      cityName,
      name: address?.FullName || order?.user?.Phone || "کاربر",
      postcode: address?.PostalCode || "",
      nationalCode: "",
      callNumber: address?.Phone || order?.user?.Phone || "",
      address: address?.FullAddress || "",
      weight,
      boxSizeId: order?.ShippingBoxSizeId || undefined,
      isnonstandard: 0,
      sum,
    });

    if (!res?.ok || !res?.data) return;

    const updateData: any = {
      ShippingBarcode: res.data.barcode,
      ShippingPostPrice: Number(res.data.postprice || 0),
      ShippingTax: Number(res.data.tax || 0),
      ShippingWeight: weight,
      ShippingBoxSizeId: res.data.boxSizeId || order?.ShippingBoxSizeId || 0,
    };

    await strapi.entityService.update("api::order.order", Number(orderId), {
      data: updateData,
    });
  } catch (error: any) {
    try {
      strapi.log.error(
        `[anipo] auto barcode error orderId=${orderId} message=${error?.message}`
      );
    } catch {}
  }
}
