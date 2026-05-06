import type { Strapi } from "@strapi/strapi";
import { logAdminBarcodeOperation } from "../../../../utils/adminActivity";

export async function generateAnipoBarcodeHandler(strapi: Strapi, ctx: any) {
  const { id } = ctx.params;
  try {
    const order: any = await strapi.entityService.findOne(
      "api::order.order",
      Number(id),
      {
        populate: {
          user: true,
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

    if (!order) return ctx.notFound("order not found");
    if (order.ShippingBarcode) {
      ctx.body = {
        success: true,
        already: true,
        barcode: order.ShippingBarcode,
      };
      return;
    }

    // Compute weight based on items (default 100g each product if missing)
    let weight = 0;
    for (const it of order.order_items || []) {
      const product = it?.product_variation?.product;
      const w = Number(product?.Weight ?? 100) || 100;
      const count = Number(it?.Count || 0);
      weight += w * count;
    }
    if (weight <= 0) weight = 100;

    const address = order?.delivery_address;
    const cityName = address?.shipping_city?.Title || "";
    const provinceName = address?.shipping_city?.shipping_province?.Title || "";
    const provinceCode = address?.shipping_city?.shipping_province?.Code || "";

    if (!provinceCode || !cityName) {
      return ctx.badRequest("missing address province/city for anipo");
    }

    // Compute declared value (sum) from order items + shipping as fallback
    let sum = 0;
    for (const it of order.order_items || []) {
      const per = Number(it?.PerAmount || 0);
      const count = Number(it?.Count || 0);
      sum += per * count;
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

    if (!res?.ok || !res?.data) {
      return ctx.badRequest("anipo_barcode_error", { data: res });
    }

    const updateData: any = {
      ShippingBarcode: res.data.barcode,
      ShippingPostPrice: Number(res.data.postprice || 0),
      ShippingTax: Number(res.data.tax || 0),
      ShippingWeight: weight,
      ShippingBoxSizeId: res.data.boxSizeId || order?.ShippingBoxSizeId || 0,
    };
    await strapi.entityService.update("api::order.order", Number(id), {
      data: updateData as any,
    });

    // Log admin activity
    try {
      const pluginUser = ctx.state?.user;
      if (pluginUser?.id) {
        const fullUser = await strapi.db
          .query("plugin::users-permissions.user")
          .findOne({ where: { id: pluginUser.id }, populate: ["role"] });
        if (fullUser) {
          const ip = ctx.request?.ip || ctx.ip || null;
          const userAgent = ctx.request?.headers?.["user-agent"] || ctx.headers?.["user-agent"] || null;

          await logAdminBarcodeOperation(
            strapi,
            Number(id),
            "generate",
            fullUser.id,
            res.data.barcode,
            undefined,
            ip,
            userAgent,
            fullUser.role?.name,
          );
        }
      }
    } catch (activityError) {
      strapi.log.error("Failed to log admin activity for barcode generation", {
        orderId: id,
        error: (activityError as Error).message,
      });
    }

    ctx.body = { success: true, data: res.data };
  } catch (error: any) {
    strapi.log.error(
      `[anipo] generate barcode error orderId=${ctx?.params?.id} message=${error?.message}`
    );
    return ctx.badRequest("generate_barcode_failed", {
      data: { error: error?.message },
    });
  }
}
