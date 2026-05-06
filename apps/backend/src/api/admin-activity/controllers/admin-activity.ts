/**
 * admin-activity controller
 */

import { factories } from "@strapi/strapi";
import { ROLE_NAMES } from "../../../utils/roles";
import { fetchUserWithRole, normalizeRoleName } from "../../../utils/roles";

export default factories.createCoreController("api::admin-activity.admin-activity" as any, ({ strapi }) => ({
  async findMyActivities(ctx) {
    const user = ctx.state.user;
    if (!user?.id) {
      return ctx.unauthorized("Authentication required");
    }

    const page = Number(ctx.query.page ?? 1);
    const pageSize = Number(ctx.query.pageSize ?? 20);

    const activities = await strapi.entityService.findMany("api::admin-activity.admin-activity" as any, {
      filters: { performed_by: { id: user.id } },
      sort: { createdAt: "desc" },
      populate: ["performed_by"],
      pagination: { page, pageSize },
    });

    return ctx.send(activities);
  },

  async findOrderActivities(ctx) {
    const user = await fetchUserWithRole(strapi, ctx.state.user?.id);
    if (!user) {
      return ctx.unauthorized("Authentication required");
    }

    const roleName = normalizeRoleName(user?.role?.name);
    // Only superadmins can view admin activities
    if (roleName !== ROLE_NAMES.SUPERADMIN) {
      return ctx.forbidden("Only superadmins can view admin activities");
    }

    const { orderId } = ctx.params;
    const page = Number(ctx.query.page ?? 1);
    const pageSize = Number(ctx.query.pageSize ?? 20);

    const activities = await strapi.entityService.findMany("api::admin-activity.admin-activity" as any, {
      filters: {
        ResourceType: "Order",
        ResourceId: String(orderId),
      },
      sort: { createdAt: "desc" },
      populate: ["performed_by"],
      pagination: { page, pageSize },
    });

    return ctx.send(activities);
  },

  async findUserActivities(ctx) {
    const user = await fetchUserWithRole(strapi, ctx.state.user?.id);
    if (!user) {
      return ctx.unauthorized("Authentication required");
    }

    const roleName = normalizeRoleName(user?.role?.name);
    // Only superadmins can view admin activities for other users
    if (roleName !== ROLE_NAMES.SUPERADMIN) {
      return ctx.forbidden("Only superadmins can view admin activities");
    }

    const { userId } = ctx.params;
    const page = Number(ctx.query.page ?? 1);
    const pageSize = Number(ctx.query.pageSize ?? 20);

    const activities = await strapi.entityService.findMany("api::admin-activity.admin-activity" as any, {
      filters: {
        ResourceType: "User",
        ResourceId: String(userId),
      },
      sort: { createdAt: "desc" },
      populate: ["performed_by"],
      pagination: { page, pageSize },
    });

    return ctx.send(activities);
  },

  async findProductActivities(ctx) {
    const user = await fetchUserWithRole(strapi, ctx.state.user?.id);
    if (!user) {
      return ctx.unauthorized("Authentication required");
    }

    const roleName = normalizeRoleName(user?.role?.name);
    // Only superadmins can view admin activities
    if (roleName !== ROLE_NAMES.SUPERADMIN) {
      return ctx.forbidden("Only superadmins can view admin activities");
    }

    const { productId } = ctx.params;
    const page = Number(ctx.query.page ?? 1);
    const pageSize = Number(ctx.query.pageSize ?? 20);

    const activities = await strapi.entityService.findMany("api::admin-activity.admin-activity" as any, {
      filters: {
        ResourceType: "Product",
        ResourceId: String(productId),
      },
      sort: { createdAt: "desc" },
      populate: ["performed_by"],
      pagination: { page, pageSize },
    });

    return ctx.send(activities);
  },

  async findReport(ctx) {
    const user = await fetchUserWithRole(strapi, ctx.state.user?.id);
    if (!user) {
      return ctx.unauthorized("Authentication required");
    }

    const roleName = normalizeRoleName(user?.role?.name);
    // Only superadmins can view admin activity reports
    if (roleName !== ROLE_NAMES.SUPERADMIN) {
      return ctx.forbidden("Only superadmins can view admin activity reports");
    }

    const page = Number(ctx.query.page ?? 1);
    const pageSize = Number(ctx.query.pageSize ?? 50);
    const startDate = ctx.query.startDate as string | undefined;
    const endDate = ctx.query.endDate as string | undefined;
    const performedBy = ctx.query.performedBy as string | undefined;
    const resourceType = ctx.query.resourceType as string | undefined;

    const filters: any = {};
    if (startDate || endDate) {
      filters.createdAt = {} as any;
      if (startDate) {
        (filters.createdAt as any).$gte = new Date(startDate);
      }
      if (endDate) {
        (filters.createdAt as any).$lte = new Date(endDate);
      }
    }
    if (performedBy) {
      filters.performed_by = { id: Number(performedBy) };
    }
    if (resourceType) {
      filters.ResourceType = resourceType;
    }

    const activities = await strapi.entityService.findMany("api::admin-activity.admin-activity" as any, {
      filters,
      sort: { createdAt: "desc" },
      populate: ["performed_by"],
      pagination: { page, pageSize },
    });

    return ctx.send(activities);
  },
}));

