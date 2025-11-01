import jwt from "jsonwebtoken";
/**
 * `authentication` middleware
 */

import { Strapi } from "@strapi/strapi";

export default (config, { strapi }: { strapi: Strapi }) => {
  // Add your own logic here.
  return async (ctx, next) => {
    // reading auth token from header and check if it is valid
    try {
      const token = ctx.request.headers["authorization"]?.split(" ")[1];
      if (token) {
        const userPayload = JSON.parse(
          JSON.stringify(jwt.verify(token, process.env.JWT_SECRET))
        ) as {
          userId: string;
        };

        const user = await strapi
          .query("api::local-user.local-user")
          .findOne({
            where: {
              id: Number(userPayload.userId),
            },
            populate: {
              user_role: true,
            },
          });

        if (!user) {
          ctx.notFound("User not found");
          return;
        }

        delete user.Password;

        ctx.state.user = user;
      } else {
        ctx.unauthorized("Token is required");
        return;
      }

      return await next();
    } catch (e) {
      strapi.log.error(e);

      ctx.unauthorized("Invalid token");
    }
  };
};
