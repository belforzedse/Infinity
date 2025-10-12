import type { Strapi } from "@strapi/strapi";

export async function adminVoidBarcodeHandler(strapi: Strapi, ctx: any) {
  const { id } = ctx.params;
  const { reason } = ctx.request.body || {};

  try {
    const user = ctx.state.user;
    const roleId =
      typeof user?.user_role === "object"
        ? user.user_role?.id
        : user?.user_role;
    if (!user || Number(roleId) !== 2) {
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
        PerformedBy: `Admin User ${user.id}`,
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
