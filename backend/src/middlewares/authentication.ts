import jwt from "jsonwebtoken";
/**
 * `authentication` middleware
 */

import { Strapi } from "@strapi/strapi";

export default (_config, { strapi }: { strapi: Strapi }) => {
  return async (ctx, next) => {
    try {
      const rawHeader = ctx.request.headers["authorization"];
      const token = rawHeader?.startsWith("Bearer ") ? rawHeader.split(" ")[1] : undefined;

      if (!token) {
        ctx.unauthorized("Token is required");
        return;
      }

      // Try plugin JWT first (users-permissions)
      let payload: any = null;
      try {
        payload = await strapi.plugin("users-permissions").service("jwt").verify(token);
      } catch {
        // Fallback to manual verify with JWT_SECRET for legacy tokens
        payload = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret");
      }

      const userId = Number(payload?.id || payload?.userId);
      if (!userId || Number.isNaN(userId)) {
        ctx.unauthorized("Invalid token payload");
        return;
      }

      // Prefer plugin user model; populate role + optional local user role
      const user = await strapi.entityService.findOne("plugin::users-permissions.user", userId, {
        populate: ["role", "user_role"],
      });

      if (!user) {
        ctx.notFound("User not found");
        return;
      }

      if (user.blocked) {
        ctx.unauthorized("User is blocked");
        return;
      }

      // mirror previous shape, but avoid password
      const { password, resetPasswordToken, confirmationToken, ...safeUser } = user as any;
      ctx.state.user = safeUser;

      return await next();
    } catch (e) {
      strapi.log.error("Auth middleware error", e);
      ctx.unauthorized("Invalid token");
    }
  };
};
