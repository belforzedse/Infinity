import { RateLimit } from "koa2-ratelimit";

/**
 * `discount-throttle` middleware
 * Rate limiting for discount code validation
 * Lighter restrictions than auth throttle: 5 attempts per minute
 */

import { Strapi } from "@strapi/strapi";

export default (config, { strapi }: { strapi: Strapi }) => {
  const limiter = RateLimit.middleware({
    skipFailedRequests: true,
    interval: { min: 1 }, // Time window in minutes
    max: 5, // Maximum number of requests per interval
  });

  return async (ctx, next) => {
    try {
      // Apply the rate limiter to the current request
      return await limiter(ctx, next);
    } catch (err) {
      if (err.status === 429) {
        // Handle rate limit exceeded error
        strapi.log.warn("Discount validation rate limit exceeded", {
          userId: ctx.state?.user?.id,
          ip: ctx.request.ip,
          path: ctx.path,
        });
        ctx.status = 429;
        ctx.body = {
          statusCode: 429,
          error: "Too Many Requests",
          message:
            "Too many discount code attempts. Please try again in 1 minute.",
        };
        return ctx;
      } else {
        // Re-throw other errors to be handled by Strapi's error-handling middleware
        throw err;
      }
    }
  };
};
