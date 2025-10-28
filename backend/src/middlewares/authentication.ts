import jwt from "jsonwebtoken";
import { Strapi } from "@strapi/strapi";

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
        payload = pluginJwt.verify(token);
      } catch (err) {
        if (process.env.JWT_SECRET) {
          payload = jwt.verify(token, process.env.JWT_SECRET) as any;
        } else {
          throw err;
        }
      }

      const localUserId = Number(
        payload?.localUserId ??
          payload?.userId ??
          payload?.id ??
          payload?.sub
      );

      if (!localUserId || Number.isNaN(localUserId)) {
        ctx.unauthorized("Invalid token payload");
        return;
      }

      let user = await strapi
        .query("api::local-user.local-user")
        .findOne({
          where: { id: localUserId },
          populate: { user_role: true },
        });

      if (!user && payload?.id) {
        const pluginUser = await strapi
          .query("plugin::users-permissions.user")
          .findOne({ where: { id: Number(payload.id) } });

        if (pluginUser?.username) {
          user = await strapi
            .query("api::local-user.local-user")
            .findOne({
              where: { Phone: pluginUser.username },
              populate: { user_role: true },
            });
        }
      }

      if (!user) {
        ctx.notFound("User not found");
        return;
      }

      delete user.Password;
      ctx.state.user = user;

      await next();
    } catch (error) {
      strapi.log.error(error);
      ctx.unauthorized("Invalid token");
    }
  };
};
