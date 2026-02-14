import type { Strapi } from "@strapi/strapi";

/**
 * Returns the user's active reserve order (if any), with all linked orders in the group.
 * An active reserve: IsReserveOrder=true AND ReserveExpiresAt > now.
 * Returns the most recent active group (by ReserveExpiresAt) if user has multiple.
 */
export async function getActiveReserveHandler(strapi: Strapi, ctx: { state: { user: { id: number } }; body?: object }) {
  const { user } = ctx.state;
  if (!user?.id) {
    return { data: null };
  }

  const now = new Date();
  const oneActive = await strapi.db.query("api::order.order").findOne({
    where: {
      user: { id: user.id },
      IsReserveOrder: true,
      ReserveExpiresAt: { $gt: now.toISOString() },
      Status: { $in: ["Started", "Paying"] },
    },
    orderBy: { ReserveExpiresAt: "desc" },
  });

  if (!oneActive?.ReserveGroupId) {
    return { data: null };
  }

  const groupId = oneActive.ReserveGroupId;
  const orders = await strapi.db.query("api::order.order").findMany({
    where: {
      user: { id: user.id },
      ReserveGroupId: groupId,
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

  const expiresAt = orders[0]?.ReserveExpiresAt ?? oneActive.ReserveExpiresAt;

  return {
    data: {
      reserveGroupId: groupId,
      reserveExpiresAt: expiresAt,
      orders,
      orderCount: orders.length,
    },
  };
}
