import type { Strapi } from "@strapi/strapi";

export async function adminVoidBarcodeHandler(strapi: Strapi, ctx: any) {
  const { id } = ctx.params;
  const { reason } = ctx.request.body || {};

  try {
    const localUser = ctx.state.localUser ?? ctx.state.user;
    const pluginUser = ctx.state.pluginUser;

    const roleId =
      typeof localUser?.user_role === "object"
        ? (localUser.user_role as any)?.id
        : localUser?.user_role;

    const pluginRole =
      typeof pluginUser?.role === "object" && pluginUser.role
        ? String(
            (pluginUser.role as Record<string, unknown>)?.name ??
              (pluginUser.role as Record<string, unknown>)?.type ??
              ""
          ).toLowerCase()
        : "";

    const isAdminRole =
      Number(roleId) === 2 ||
      pluginRole === "admin" ||
      pluginRole === "super-admin" ||
      pluginRole.includes("admin");

    if (!localUser || !isAdminRole) {
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
        PerformedBy: `Admin User ${localUser.id}`,
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
