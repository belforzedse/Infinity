import type { Strapi } from "@strapi/strapi";

/** Context shape for getActiveReserve: state and methods used by the handler. */
export type GetActiveReserveContext = {
  state: { user?: { id: number } };
  unauthorized: (message?: string) => never;
  body?: object;
};

/**
 * Returns the user's active reserve order (if any), with all linked orders in the group.
 * An active reserve: isReserveOrder=true AND reserveExpiresAt > now.
 * Returns the most recent active group (by reserveExpiresAt) if user has multiple.
 */
export async function getActiveReserveHandler(
  strapi: Strapi,
  ctx: GetActiveReserveContext,
): Promise<
  | { data: null; error?: never }
  | { data: { reserveGroupId: string; reserveExpiresAt: unknown; orders: unknown[]; orderCount: number }; error?: never }
  | { data: null; error: { message: string; details?: unknown } }
> {
  const { user } = ctx.state;
  if (!user?.id) {
    ctx.unauthorized("Unauthorized");
    return { data: null };
  }

  const userId = user.id;

  try {
    const now = new Date();
    const oneActive = await strapi.db.query("api::order.order").findOne({
      where: {
        user: { id: userId },
        isReserveOrder: true,
        reserveExpiresAt: { $gt: now.toISOString() },
        Status: { $in: ["Started", "Paying"] },
      },
      orderBy: { reserveExpiresAt: "desc" },
    });

    if (oneActive?.reserveGroupId) {
      strapi.log.debug("getActiveReserve: found active reserve", {
        userId,
        reserveGroupId: oneActive.reserveGroupId,
      });
    }

    if (!oneActive?.reserveGroupId) {
      return { data: null };
    }

    const groupId = oneActive.reserveGroupId;

    const orders = await strapi.db.query("api::order.order").findMany({
      where: {
        user: { id: userId },
        reserveGroupId: groupId,
      },
      populate: {
        order_items: {
          populate: {
            product_variation: {
              populate: {
                product: { populate: ["CoverImage"] },
                product_variation_color: true,
                product_variation_size: true,
                product_variation_model: true,
              },
            },
          },
        },
        shipping: true,
        delivery_address: {
          populate: {
            shipping_city: { populate: { shipping_province: true } },
          },
        },
      },
      orderBy: { Date: "asc" },
    });

    strapi.log.debug("getActiveReserve: fetched orders for group", {
      userId,
      reserveGroupId: groupId,
      orderCount: orders.length,
    });

    const expiresAt = orders[0]?.reserveExpiresAt ?? oneActive.reserveExpiresAt;

    return {
      data: {
        reserveGroupId: groupId,
        reserveExpiresAt: expiresAt,
        orders,
        orderCount: orders.length,
      },
    };
  } catch (err) {
    strapi.log.error("getActiveReserve failed", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      data: null,
      error: {
        message: "Failed to get active reserve",
        details: err instanceof Error ? err.message : String(err),
      },
    };
  }
}
