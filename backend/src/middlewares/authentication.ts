/**
 * `authentication` middleware
 * Temporarily uses the numeric user id passed in the Authorization header.
 * This lets us bypass JWT handling while the token service is being repaired.
 */

import { Strapi } from "@strapi/strapi";

export default (_config, { strapi }: { strapi: Strapi }) => {
  return async (ctx, next) => {
    try {
      const authHeader = ctx.request.headers["authorization"];
      const token = authHeader?.includes(" ")
        ? authHeader.split(" ")[1]
        : authHeader;

      if (!token) {
        ctx.unauthorized("Token is required");
        return;
      }

      const userId = Number(token);
      if (!Number.isInteger(userId) || userId <= 0) {
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
