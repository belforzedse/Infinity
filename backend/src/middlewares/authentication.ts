import jwt from "jsonwebtoken";
/**
 * `authentication` middleware
 */

import { Strapi } from "@strapi/strapi";

export default (_config, { strapi }: { strapi: Strapi }) => {
  return async (ctx, next) => {
    try {
      const token = ctx.request.headers["authorization"]?.split(" ")[1];

      if (!token) {
        ctx.unauthorized("Token is required");
        return;
      }

      const userPayload = jwt.verify(token, process.env.JWT_SECRET) as {
        userId?: string | number;
      };

      const userId = Number(userPayload?.userId);
      if (!userId || Number.isNaN(userId)) {
        ctx.unauthorized("Invalid token payload");
        return;
      }

      const user = await strapi
        .query("api::local-user.local-user")
        .findOne({
          where: { id: userId },
          populate: { user_role: true },
        });

      if (!user) {
        ctx.notFound("User not found");
        return;
      }

      delete (user as any).Password;

      ctx.state.user = user;

      await next();
    } catch (error) {
      strapi.log.error(error);
      ctx.unauthorized("Invalid token");
    }
  };
};
