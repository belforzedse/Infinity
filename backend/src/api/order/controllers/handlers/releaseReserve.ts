import type { Attribute } from "@strapi/types";
import type { Strapi } from "@strapi/strapi";

/** Context shape for releaseReserve: state and methods used by the handler. */
type ReleaseReserveContext = {
  params: { id: string };
  state: { user: { id: number } | undefined };
  badRequest: (msg: string, opts?: object) => void;
  unauthorized: (msg?: string, opts?: object) => void;
};

/**
 * Manually ends the reserve window for an order and all orders in its group.
 * Clears isReserveOrder and reserveExpiresAt so orders become normal and ready for admin to ship.
 */
export async function releaseReserveHandler(
  strapi: Strapi,
  ctx: ReleaseReserveContext
) {
  const { id } = ctx.params;
  const { user } = ctx.state;

  if (!user?.id) {
    return ctx.unauthorized("Authentication required", {
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

  if (!order.isReserveOrder || !order.reserveGroupId) {
    return ctx.badRequest("This order is not a reserve order", {
      data: { success: false, errorCode: "NOT_RESERVE_ORDER" },
    });
  }

  const now = new Date();
  const expiresAt = order.reserveExpiresAt ? new Date(order.reserveExpiresAt) : null;
  if (expiresAt && expiresAt <= now) {
    return ctx.badRequest("Reserve window has already expired", {
      data: { success: false, errorCode: "RESERVE_EXPIRED" },
    });
  }

  const groupId = order.reserveGroupId;
  const groupOrders = await strapi.db.query("api::order.order").findMany({
    where: { user: { id: user.id }, reserveGroupId: groupId },
  });

  await strapi.db.transaction(async () => {
    for (const o of groupOrders) {
      await strapi.entityService.update("api::order.order", o.id, {
        data: {
          isReserveOrder: false,
          reserveExpiresAt: null,
        },
      });
      try {
        await strapi.entityService.create("api::order-log.order-log", {
          data: {
            order: o.id,
            performed_by: user.id,
            Action: "Update",
            Description: "Reserve released; order no longer in reserve group",
            PerformedBy: `User ${user.id}`,
            Changes: {
              reserveGroupId: groupId,
              previous: { isReserveOrder: true },
              new: { isReserveOrder: false },
            } as unknown as Attribute.JsonValue,
          },
        });
      } catch (logErr) {
        strapi.log.error("Failed to create order-log for release_reserve", {
          orderId: o.id,
          reserveGroupId: groupId,
          error: logErr,
        });
      }
    }
  });

  strapi.log.info("Reserve released", {
    orderId,
    userId: user.id,
    reserveGroupId: groupId,
    action: "release_reserve",
    orderCount: groupOrders.length,
  });

  return {
    data: {
      success: true,
      message: "Reserve released. Your order is now being prepared for shipping.",
      orderCount: groupOrders.length,
    },
  };
}
