import jwt from "jsonwebtoken";
/**
 * `authentication` middleware
 */

import { Strapi } from "@strapi/strapi";

export default (config, { strapi }: { strapi: Strapi }) => {
  return async (ctx, next) => {
    try {
      const token = ctx.request.headers["authorization"]?.split(" ")[1];
      if (!token) {
        ctx.unauthorized("Token is required");
        return;
      }

      const pluginJwtService = strapi
        .plugin("users-permissions")
        .service("jwt") as any;

      let payload: any;

      try {
        payload = pluginJwtService.verify(token);
      } catch {
        payload = jwt.verify(token, process.env.JWT_SECRET) as any;
      }

      const localUserId =
        typeof payload.localUserId === "number"
          ? payload.localUserId
          : Number(payload.userId);

      if (Number.isNaN(localUserId)) {
        strapi.log.warn("authentication middleware: invalid payload", {
          payload,
        });
      }

      if (!localUserId || Number.isNaN(localUserId)) {
        ctx.unauthorized("Invalid token payload");
        return;
      }

      const user = await strapi.query("api::local-user.local-user").findOne({
        where: { id: localUserId },
        populate: { user_role: true },
      });

      if (!user) {
        ctx.notFound("User not found");
        return;
      }

      delete user.Password;
      ctx.state.user = user;

      return await next();
    } catch (e) {
      strapi.log.error(e);
      ctx.unauthorized("Invalid token");
    }
  };
};
