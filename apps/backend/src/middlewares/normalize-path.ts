import type { Context, Next } from "koa";

/**
 * Collapse duplicate slashes in the request path before static-file serving and routing.
 *
 * Some third-party admin plugins (e.g. strapi-plugin-rest-cache) build request URLs with a
 * doubled leading slash, e.g. `GET //rest-cache/config/strategy`. koa-static's path resolver
 * (`strapi::public`) rejects such paths as "Malicious Path" (400) before they can reach their
 * real route handler, producing noisy errors and a broken plugin settings page.
 *
 * Merging repeated slashes — the same normalization nginx performs with `merge_slashes on` —
 * lets these requests route correctly. It is a no-op for every well-formed request: a literal
 * `//` is never semantically meaningful for routing, and encoded slashes (`%2F`) are untouched.
 */
export default () => {
  return async (ctx: Context, next: Next) => {
    if (ctx.path.includes("//")) {
      const normalizedPath = ctx.path.replace(/\/{2,}/g, "/");
      ctx.url = normalizedPath + (ctx.querystring ? `?${ctx.querystring}` : "");
    }
    await next();
  };
};
