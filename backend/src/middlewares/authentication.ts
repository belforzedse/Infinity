import jwt from "jsonwebtoken";
import { Strapi } from "@strapi/strapi";

const API_ADMIN_ROLE_ID = Number(process.env.API_ADMIN_ROLE_ID || 3);
const LOCAL_ADMIN_ROLE_ID = 2;

const isNumericString = (value: unknown): value is string =>
  typeof value === "string" && /^\d+$/.test(value);

const normalizeId = (rawValue: unknown) => {
  if (rawValue === null || rawValue === undefined) return null;
  if (typeof rawValue === "string") {
    const trimmed = rawValue.trim();
    if (!trimmed.length) return null;
    return isNumericString(trimmed) ? Number(trimmed) : trimmed;
  }
  return rawValue;
};

export default (_config, { strapi }: { strapi: Strapi }) => {
  return async (ctx, next) => {
    try {
      const authHeader = ctx.request.headers["authorization"];
      const token = authHeader?.split(" ")[1];

      if (!token) {
        ctx.unauthorized("Token is required");
        return;
      }

      const pluginJwt = strapi
        .plugin("users-permissions")
        .service("jwt") as any;

      let payload: any | null = null;

      try {
        payload = await pluginJwt.verify(token);
      } catch (err) {
        if (process.env.JWT_SECRET) {
          payload = jwt.verify(token, process.env.JWT_SECRET) as any;
        } else {
          throw err;
        }
      }

      const rawLocalUserId =
        payload?.localUserId ??
        payload?.userId ??
        payload?.merchant ??
        payload?.sub;

      const rawPluginUserId = payload?.id ?? payload?.pluginUserId;

      const localUserId = normalizeId(rawLocalUserId);
      const pluginUserId = normalizeId(rawPluginUserId);

      let localUser = null;
      if (localUserId !== null && localUserId !== undefined) {
        localUser = await strapi
          .query("api::local-user.local-user")
          .findOne({
            where: { id: localUserId },
            populate: { user_role: true },
          });
      }

      let pluginUser = null;
      if (pluginUserId !== null && pluginUserId !== undefined) {
        pluginUser = await strapi
          .query("plugin::users-permissions.user")
          .findOne({
            where: { id: pluginUserId },
            populate: { role: true },
          });
      }

      if (!pluginUser && localUser?.Phone) {
        pluginUser = await strapi
          .query("plugin::users-permissions.user")
          .findOne({
            where: { username: localUser.Phone },
            populate: { role: true },
          });
      }

      if (!localUser && pluginUser?.username) {
        localUser = await strapi
          .query("api::local-user.local-user")
          .findOne({
            where: { Phone: pluginUser.username },
            populate: { user_role: true },
          });
      }

      if (!localUser) {
        ctx.notFound("User not found");
        return;
      }

      if (!pluginUser) {
        strapi.log.warn("authentication middleware missing plugin user", {
          tokenPayload: payload,
          localUserId: localUser?.id,
        });
        ctx.unauthorized("Invalid token payload");
        return;
      }

      if ("Password" in localUser) {
        delete (localUser as any).Password;
      }
      if ("password" in pluginUser) {
        delete (pluginUser as any).password;
      }
      if ("resetPasswordToken" in pluginUser) {
        delete (pluginUser as any).resetPasswordToken;
      }
      if ("confirmationToken" in pluginUser) {
        delete (pluginUser as any).confirmationToken;
      }

      const normalizedLocalRoleTitle = String(
        (localUser?.user_role as any)?.Title ??
          (localUser?.user_role as any)?.attributes?.Title ??
          ""
      )
        .trim()
        .toLowerCase();

      const normalizedPluginRoleTitle = String(
        (pluginUser?.role as any)?.name ??
          (pluginUser?.role as any)?.type ??
          ""
      )
        .trim()
        .toLowerCase();

      const isAdmin =
        Boolean(payload?.isAdmin) ||
        Number((localUser?.user_role as any)?.id) === LOCAL_ADMIN_ROLE_ID ||
        normalizedLocalRoleTitle.includes("admin") ||
        Number((pluginUser?.role as any)?.id) === API_ADMIN_ROLE_ID ||
        normalizedPluginRoleTitle.includes("admin");

      let ability: any = null;
      try {
        const permissionService = strapi
          .plugin("users-permissions")
          .service("permission") as any;

        if (pluginUser?.role?.id) {
          const rolePermissions = await Promise.resolve(pluginUser.role.id)
            .then(permissionService.findRolePermissions)
            .then((perms: any[]) =>
              perms.map(permissionService.toContentAPIPermission)
            ) as any[];

          ability = await strapi.contentAPI.permissions.engine.generateAbility(
            rolePermissions
          );
        }
      } catch (abilityError) {
        strapi.log.warn("Failed to generate users-permissions ability", {
          pluginUserId: pluginUser?.id,
          error: abilityError,
        });
      }

      ctx.state.localUser = localUser;
      ctx.state.pluginUser = pluginUser;
      ctx.state.user = pluginUser;
      ctx.state.isAdmin = isAdmin;
      ctx.state.userAbility = ability;
      ctx.state.ability = ability;
      ctx.state.auth = {
        authenticated: true,
        credentials: pluginUser,
        ability,
        tokenPayload: payload,
      };

      await next();
    } catch (error) {
      strapi.log.error(error);
      ctx.unauthorized("Invalid token");
    }
  };
};
