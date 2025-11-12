import type { Strapi } from "@strapi/strapi";

export async function adminVoidBarcodeHandler(strapi: Strapi, ctx: any) {
  const { id } = ctx.params;
  const { reason } = ctx.request.body || {};

  try {
    // Admin guard: ensure plugin user has an admin/store-manager role
    const pluginUser = ctx.state.user;
    if (!pluginUser) return ctx.forbidden("Admin access required");
    const fullUser = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({ where: { id: pluginUser.id }, populate: ["role"] });
    const roleName = fullUser?.role?.name;
    if (!fullUser || (roleName !== "Superadmin" && roleName !== "Store manager")) {
      return ctx.forbidden("Admin access required");
    }

    const order = await strapi.db.query("api::order.order").findOne({
      where: { id },
      populate: {
        contract: true,
      },
    });

    if (!order) {
      return ctx.notFound("Order not found");
    }

    if (!order.ShippingBarcode) {
      return ctx.badRequest("No shipping barcode to remove", {
        data: { error: "no_barcode" },
      });
    }

    await strapi.db.query("api::order.order").update({
      where: { id },
      data: {
        ShippingBarcode: null,
      },
    });

    await strapi.db.query("api::order-log.order-log").create({
      data: {
        order: id,
        Action: "Update",
        Description: "Admin removed shipping barcode",
        Changes: {
          reason: reason || "",
          previousBarcode: order.ShippingBarcode,
        },
              PerformedBy: `Admin User ${fullUser.id}`,
      },
    });

    return {
      data: {
        success: true,
      },
    };
  } catch (error: any) {
    strapi.log.error("adminVoidBarcode error", error);
    return ctx.internalServerError("Failed to remove shipping barcode", {
      data: { error: error.message },
    });
  }
}
