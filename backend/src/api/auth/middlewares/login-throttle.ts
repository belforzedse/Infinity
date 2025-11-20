import { RateLimit } from "koa2-ratelimit";

/**
 * `login-throttle` middleware
 * Prevents brute force attacks on login endpoint while allowing legitimate attempts
 * Allows 5 login attempts per 10 minutes per IP
 */

import { Strapi } from "@strapi/strapi";

export default (config, { strapi }: { strapi: Strapi }) => {
  const limiter = RateLimit.middleware({
    skipFailedRequests: false, // Count failed attempts
    interval: { min: 10 }, // 10 minute window
    max: 5, // Maximum 5 attempts per interval
    prefixKey: "login-rate-limit:", // Separate from OTP throttle
  });

  return async (ctx, next) => {
    try {
      // Apply the rate limiter to the current request
      return await limiter(ctx, next);
    } catch (err) {
      if (err.status === 429) {
        // Handle rate limit exceeded error
        strapi.log.warn("Login rate limit exceeded", {
          ip: ctx.request.ip,
          path: ctx.request.path,
        });
        ctx.status = 429;
        ctx.body = {
          statusCode: 429,
          error: "Too Many Requests",
          message:
            "تعداد تلاش‌های ورود شما بیش از حد مجاز است. لطفاً 10 دقیقه دیگر دوباره تلاش کنید.",
          messageEn:
            "Too many login attempts. Please try again in 10 minutes.",
        };
        return ctx;
      } else {
        // Re-throw other errors to be handled by Strapi's error-handling middleware
        throw err;
      }
    }
  };
};
