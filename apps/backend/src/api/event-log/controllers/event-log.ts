/**
 * event-log controller
 */

import { factories } from "@strapi/strapi";
import type { Strapi } from "@strapi/strapi";

export default factories.createCoreController(
  "api::event-log.event-log" as any,
  ({ strapi }: { strapi: Strapi }) => ({
    /**
     * Get events for the current user
     */
    async getMyEvents(ctx) {
      const user = ctx.state.user;
      if (!user?.id) {
        return ctx.unauthorized("Authentication required");
      }

      const userId = Number(user.id);
      const { page = 1, pageSize = 20, sort = "createdAt:desc" } = ctx.query;

      const filters: any = {};
      if (ctx.query.eventType) filters.eventType = ctx.query.eventType;
      if (ctx.query.audience) filters.audience = ctx.query.audience;
      if (ctx.query.severity) filters.severity = ctx.query.severity;
      if (ctx.query.resourceType) filters.resourceType = ctx.query.resourceType;
      if (ctx.query.resourceId) filters.resourceId = ctx.query.resourceId;
      if (ctx.query.startDate) filters.startDate = ctx.query.startDate;
      if (ctx.query.endDate) filters.endDate = ctx.query.endDate;

      const result = await strapi
        .service("api::event-log.event-log" as any)
        .getUserEvents(userId, {
          filters,
          page: Number(page),
          pageSize: Number(pageSize),
          sort,
        });

      return ctx.send(result);
    },

    /**
     * Get events for an order (user can only see their own orders)
     */
    async getOrderEvents(ctx) {
      const { orderId } = ctx.params;
      const user = ctx.state.user;
      if (!user?.id) {
        return ctx.unauthorized("Authentication required");
      }

      const userId = Number(user.id);

      // Verify user owns the order or is admin
      const requesterRoleType = user?.role?.type?.toLowerCase();
      const requesterRoleName = user?.role?.name?.toLowerCase();
      const isAdminUser =
        user?.isAdmin === true ||
        requesterRoleType === "superadmin" ||
        requesterRoleType === "store-manager" ||
        requesterRoleName === "superadmin" ||
        requesterRoleName === "store manager";

      if (!isAdminUser) {
        // Check if user owns the order
        const order = (await strapi.entityService.findOne(
          "api::order.order" as any,
          orderId,
          { fields: ["id"], populate: { user: { fields: ["id"] } } }
        )) as any;

        if (!order) {
          return ctx.notFound("Order not found");
        }

        const orderOwnerId = order.user?.id ? Number(order.user.id) : null;
        if (!orderOwnerId || orderOwnerId !== userId) {
          return ctx.forbidden("You do not have permission to access this order");
        }
      }

      const { page = 1, pageSize = 50, sort = "createdAt:asc" } = ctx.query;

      const filters: any = {};
      if (ctx.query.audience) filters.audience = ctx.query.audience;
      if (ctx.query.severity) filters.severity = ctx.query.severity;

      const result = await strapi
        .service("api::event-log.event-log" as any)
        .getOrderEvents(orderId, {
          filters,
          page: Number(page),
          pageSize: Number(pageSize),
          sort,
        });

      return ctx.send(result);
    },

    /**
     * Get admin events (admin/superadmin only)
     */
    async getAdminEvents(ctx) {
      const user = ctx.state.user;
      if (!user?.id) {
        return ctx.unauthorized("Authentication required");
      }

      const requesterRoleType = user?.role?.type?.toLowerCase();
      const requesterRoleName = user?.role?.name?.toLowerCase();
      const isAdminUser =
        user?.isAdmin === true ||
        requesterRoleType === "superadmin" ||
        requesterRoleType === "store-manager" ||
        requesterRoleName === "superadmin" ||
        requesterRoleName === "store manager";

      if (!isAdminUser) {
        return ctx.forbidden("Admin access required");
      }

      const { page = 1, pageSize = 20, sort = "createdAt:desc" } = ctx.query;

      const filters: any = {};
      if (ctx.query.eventType) filters.eventType = ctx.query.eventType;
      if (ctx.query.audience) filters.audience = ctx.query.audience;
      if (ctx.query.severity) filters.severity = ctx.query.severity;
      if (ctx.query.resourceType) filters.resourceType = ctx.query.resourceType;
      if (ctx.query.resourceId) filters.resourceId = ctx.query.resourceId;
      if (ctx.query.relatedUserId) filters.relatedUserId = Number(ctx.query.relatedUserId);
      if (ctx.query.startDate) filters.startDate = ctx.query.startDate;
      if (ctx.query.endDate) filters.endDate = ctx.query.endDate;

      const result = await strapi
        .service("api::event-log.event-log" as any)
        .getAdminEvents({
          filters,
          page: Number(page),
          pageSize: Number(pageSize),
          sort,
        });

      return ctx.send(result);
    },
  })
);
