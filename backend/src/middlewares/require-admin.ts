import type { Strapi } from "@strapi/strapi";

/**
 * Require authenticated user to have admin privileges
 */
export default (_config, { strapi }: { strapi: Strapi }) => {
  return async (ctx, next) => {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized("Authentication required");
    }

    let roleId: number | undefined;
    let roleTitle: string | undefined;

    const rawRole = user.user_role ?? user.user_role?.data;

    if (typeof rawRole === "number") {
      roleId = rawRole;
    } else if (typeof rawRole === "object" && rawRole !== null) {
      if ("id" in rawRole && typeof rawRole.id === "number") {
        roleId = rawRole.id;
      }
      if ("Title" in rawRole && typeof rawRole.Title === "string") {
        roleTitle = rawRole.Title;
      }
      if (
        "attributes" in rawRole &&
        rawRole.attributes &&
        typeof rawRole.attributes === "object"
      ) {
        const attrs = rawRole.attributes as Record<string, unknown>;
        if (typeof attrs.Title === "string") {
          roleTitle = attrs.Title;
        }
      }
    }

    const isAdminRoleId = typeof roleId === "number" && roleId === 2;
    const isAdminTitle =
      typeof roleTitle === "string" &&
      roleTitle.trim().toLowerCase() === "admin";

    if (!isAdminRoleId && !isAdminTitle) {
      strapi.log.warn("Admin middleware blocked request", {
        userId: user.id,
        roleId,
        roleTitle,
        path: ctx.path,
        method: ctx.method,
      });
      return ctx.forbidden("Admin access required");
    }

    return next();
  };
};
