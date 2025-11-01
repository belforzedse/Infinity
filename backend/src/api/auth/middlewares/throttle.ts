import { RateLimit } from "koa2-ratelimit";

/**
 * `throttle` middleware
 */

import { Strapi } from "@strapi/strapi";

export default (config, { strapi }: { strapi: Strapi }) => {
  const limiter = RateLimit.middleware({
    skipFailedRequests: true,
    interval: { min: 2 }, // Time window in minutes
    max: 1, // Maximum number of requests per interval
  });

  return async (ctx, next) => {
    try {
      // Apply the rate limiter to the current request
      return await limiter(ctx, next);
    } catch (err) {
      if (err.status === 429) {
        // Handle rate limit exceeded error
        strapi.log.warn("Rate limit exceeded.");
        ctx.status = 429;
        ctx.body = {
          statusCode: 429,
          error: "Too Many Requests",
          message:
            "You have exceeded the maximum number of requests. Please try again later.",
        };
        return ctx;
      } else {
        // Re-throw other errors to be handled by Strapi's error-handling middleware
        throw err;
      }
    }
  };
};
