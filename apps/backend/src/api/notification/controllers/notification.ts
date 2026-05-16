// @ts-nocheck
/**
 * notification controller
 */

import { factories } from "@strapi/strapi";

function getPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export default factories.createCoreController("api::notification.notification", ({ strapi }) => ({
  async listMine(ctx) {
    try {
      const pluginUserId = ctx.state.user?.id;
      if (!pluginUserId) {
        return ctx.unauthorized("Authentication required");
      }

      const page = getPositiveInt(ctx.query?.page, 1);
      const pageSize = getPositiveInt(ctx.query?.pageSize, 25);
      const offset = (page - 1) * pageSize;

      const [notifications, count] = await Promise.all([
        strapi.db.query("api::notification.notification").findMany({
          where: { recipient: pluginUserId },
          populate: {
            actor: { fields: ["id", "username"] },
            post: { fields: ["id", "Slug"] },
          },
          orderBy: { createdAt: "desc" },
          limit: pageSize,
          offset,
        }),
        strapi.db.query("api::notification.notification").count({
          where: { recipient: pluginUserId },
        }),
      ]);

      return ctx.send({
        data: notifications,
        meta: {
          pagination: {
            page,
            pageSize,
            pageCount: Math.ceil(count / pageSize),
            total: count,
          },
        },
      });
    } catch (error) {
      strapi.log.error(error);
      return ctx.internalServerError("An error occurred");
    }
  },

  async unreadCount(ctx) {
    try {
      const pluginUserId = ctx.state.user?.id;
      if (!pluginUserId) {
        return ctx.unauthorized("Authentication required");
      }

      const count = await strapi.db.query("api::notification.notification").count({
        where: { recipient: pluginUserId, IsRead: false },
      });

      return ctx.send({ count });
    } catch (error) {
      strapi.log.error(error);
      return ctx.internalServerError("An error occurred");
    }
  },

  async markRead(ctx) {
    try {
      const pluginUserId = ctx.state.user?.id;
      if (!pluginUserId) {
        return ctx.unauthorized("Authentication required");
      }

      const { id } = ctx.params;
      const notification = await strapi.entityService.findOne(
        "api::notification.notification",
        id,
        { populate: ["recipient"] },
      );

      if (!notification || String(notification.recipient?.id) !== String(pluginUserId)) {
        return ctx.notFound("Notification not found");
      }

      await strapi.entityService.update("api::notification.notification", id, {
        data: { IsRead: true },
      });

      return ctx.send({ success: true });
    } catch (error) {
      strapi.log.error(error);
      return ctx.internalServerError("An error occurred");
    }
  },

  async markAllRead(ctx) {
    try {
      const pluginUserId = ctx.state.user?.id;
      if (!pluginUserId) {
        return ctx.unauthorized("Authentication required");
      }

      await strapi.db.query("api::notification.notification").updateMany({
        where: { recipient: pluginUserId, IsRead: false },
        data: { IsRead: true },
      });

      return ctx.send({ success: true });
    } catch (error) {
      strapi.log.error(error);
      return ctx.internalServerError("An error occurred");
    }
  },
}));
