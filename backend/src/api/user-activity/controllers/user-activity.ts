import { factories } from "@strapi/strapi";
import { ROLE_NAMES } from "../../../utils/roles";
import { fetchUserWithRole, normalizeRoleName } from "../../../utils/roles";

export default factories.createCoreController("api::user-activity.user-activity" as any, ({ strapi }) => ({
  async findUserActivities(ctx) {
    const user = ctx.state.user;
    if (!user?.id) {
      return ctx.unauthorized("Authentication required");
    }

    const page = Number(ctx.query.page ?? 1);
    const pageSize = Number(ctx.query.pageSize ?? 20);
    const unreadOnly = String(ctx.query.unreadOnly ?? "false") === "true";

    const filters: Record<string, unknown> = {
      user: { id: user.id },
    };
    if (unreadOnly) {
      filters.IsRead = false;
    }

    const activities = await strapi.entityService.findMany("api::user-activity.user-activity" as any, {
      filters,
      sort: { createdAt: "desc" },
      populate: ["user"],
      pagination: { page, pageSize },
    });

    return ctx.send(activities);
  },

  async markRead(ctx) {
    const user = ctx.state.user;
    if (!user?.id) {
      return ctx.unauthorized("Authentication required");
    }

    const { ids } = ctx.request.body as { ids?: number[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return ctx.badRequest("ids must be a non-empty array");
    }

    const records = await strapi.db.query("api::user-activity.user-activity" as any).findMany({
      where: {
        id: { $in: ids },
        user: { id: user.id },
      },
      select: ["id"],
    });

    const service = strapi.service("api::user-activity.user-activity") as any;
    await service.markAsRead(records.map((r: { id: number }) => r.id));

    return ctx.send({ success: true, updated: records.length });
  },

  async markAllRead(ctx) {
    const user = ctx.state.user;
    if (!user?.id) {
      return ctx.unauthorized("Authentication required");
    }

    const service = strapi.service("api::user-activity.user-activity") as any;
    await service.markAllAsRead(user.id);
    return ctx.send({ success: true });
  },

  async unreadCount(ctx) {
    const user = ctx.state.user;
    if (!user?.id) {
      return ctx.unauthorized("Authentication required");
    }

    const count = await strapi.db.query("api::user-activity.user-activity" as any).count({
      where: { user: { id: user.id }, IsRead: false },
    });

    return ctx.send({ count });
  },

  async findUserActivitiesByUserId(ctx) {
    const authenticatedUser = await fetchUserWithRole(strapi, ctx.state.user?.id);
    if (!authenticatedUser) {
      return ctx.unauthorized("Authentication required");
    }

    const { userId } = ctx.params;
    const requestedUserId = Number(userId);
    const authenticatedUserId = authenticatedUser.id;
    const authenticatedUserRole = authenticatedUser?.role?.name || null;

    const page = Number(ctx.query.page ?? 1);
    const pageSize = Number(ctx.query.pageSize ?? 20);

    try {
      const service = strapi.service("api::user-activity.user-activity") as any;
      const activities = await service.findUserActivitiesByUserId(
        requestedUserId,
        authenticatedUserId,
        authenticatedUserRole,
        { page, pageSize }
      );
      return ctx.send(activities);
    } catch (error: any) {
      if (error.message === "You can only view your own activities") {
        return ctx.forbidden(error.message);
      }
      strapi.log.error("Error fetching user activities by userId", error);
      return ctx.internalServerError("An error occurred while fetching activities");
    }
  },
}));

