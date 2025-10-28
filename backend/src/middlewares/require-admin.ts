import type { Strapi } from "@strapi/strapi";

/**
 * Require authenticated user to have admin privileges
 */
export default (_config, { strapi }: { strapi: Strapi }) => {
  return async (ctx, next) => {
    const pluginUser = ctx.state.user;
    const localUser = ctx.state.localUser;

    if (!pluginUser && !localUser) {
      return ctx.unauthorized("Authentication required");
    }

    let isAdmin = false;
    let inspectedRole: Record<string, unknown> | string | number | undefined;

    if (pluginUser?.role) {
      inspectedRole = pluginUser.role;
      const roleName =
        (typeof pluginUser.role?.name === "string"
          ? pluginUser.role.name
          : typeof pluginUser.role?.type === "string"
          ? pluginUser.role.type
          : undefined) ?? "";
      const normalized = roleName.trim().toLowerCase();
      if (
        normalized === "admin" ||
        normalized === "super-admin" ||
        normalized === "super admin" ||
        normalized === "administrator" ||
        normalized.includes("admin")
      ) {
        isAdmin = true;
      }
    }

    if (!isAdmin && localUser?.user_role) {
      inspectedRole = localUser.user_role;
      let roleId: number | undefined;
      let roleTitle: string | undefined;
      const rawRole =
        localUser.user_role?.data?.attributes ??
        localUser.user_role?.attributes ??
        localUser.user_role;

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

      const normalizedTitle = roleTitle?.trim().toLowerCase() ?? "";
      const isAdminRoleId = typeof roleId === "number" && roleId === 2;
      const isAdminTitle =
        normalizedTitle === "admin" ||
        normalizedTitle === "super admin" ||
        normalizedTitle === "administrator" ||
        normalizedTitle.includes("admin");

      if (isAdminRoleId || isAdminTitle) {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      strapi.log.warn("Admin middleware blocked request", {
        pluginUserId: pluginUser?.id,
        localUserId: localUser?.id,
        inspectedRole,
        path: ctx.path,
        method: ctx.method,
      });
      return ctx.forbidden("Admin access required");
    }

    return next();
  };
};
