import type { Strapi } from "@strapi/strapi";

/**
 * Manually ends the reserve window for an order and all orders in its group.
 * Clears IsReserveOrder and ReserveExpiresAt so orders become normal and ready for admin to ship.
 */
export async function releaseReserveHandler(
  strapi: Strapi,
  ctx: { params: { id: string }; state: { user: { id: number } }; badRequest: (msg: string, opts?: object) => void }
) {
  const { id } = ctx.params;
  const { user } = ctx.state;

  if (!user?.id) {
    return ctx.badRequest("Authentication required", {
      data: { success: false, errorCode: "UNAUTHORIZED" },
    });
  }

  const orderId = Number(id);
  if (Number.isNaN(orderId)) {
    return ctx.badRequest("Invalid order id", {
      data: { success: false, errorCode: "INVALID_ID" },
    });
  }

  const order = await strapi.db.query("api::order.order").findOne({
    where: { id: orderId, user: { id: user.id } },
  });

  if (!order) {
    return ctx.badRequest("Order not found", {
      data: { success: false, errorCode: "ORDER_NOT_FOUND" },
    });
  }

  if (!order.IsReserveOrder || !order.ReserveGroupId) {
    return ctx.badRequest("This order is not a reserve order", {
      data: { success: false, errorCode: "NOT_RESERVE_ORDER" },
    });
  }

  const now = new Date();
  const expiresAt = order.ReserveExpiresAt ? new Date(order.ReserveExpiresAt) : null;
  if (expiresAt && expiresAt <= now) {
    return ctx.badRequest("Reserve window has already expired", {
      data: { success: false, errorCode: "RESERVE_EXPIRED" },
    });
  }

  const groupId = order.ReserveGroupId;
  const groupOrders = await strapi.db.query("api::order.order").findMany({
    where: { user: { id: user.id }, ReserveGroupId: groupId },
  });

  for (const o of groupOrders) {
    await strapi.entityService.update("api::order.order", o.id, {
      data: {
        IsReserveOrder: false,
        ReserveExpiresAt: null,
      },
    });
  }

  return {
    data: {
      success: true,
      message: "Reserve released. Your order is now being prepared for shipping.",
      orderCount: groupOrders.length,
    },
  };
}
