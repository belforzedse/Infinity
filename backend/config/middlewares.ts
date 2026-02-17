const frontendUrl = process.env.FRONTEND_URL || process.env.FRONTEND_BASE_URL || "https://infinitycolor.co";
const corsOrigins = [
  frontendUrl.replace(/\/$/, ""),
  "https://new.infinitycolor.co",
  "https://infinitycolor.co",
  "http://localhost:2888",
  "http://127.0.0.1:2888",
].filter((origin, i, arr) => arr.indexOf(origin) === i); // dedupe

const allowedOriginsSet = new Set(corsOrigins);

export default [
  "strapi::logger",
  "strapi::errors",
  "strapi::security",
  "strapi::poweredBy",
  {
    name: "strapi::cors",
    config: {
      origin: (ctx: { request: { header: { origin?: string } } }): string | string[] => {
        const origin = ctx.request.header.origin;
        if (origin && allowedOriginsSet.has(origin)) {
          return origin;
        }
        return "";
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
      headers: ["Content-Type", "Authorization", "Origin", "Accept", "Accept-Language"],
      keepHeaderOnError: true,
    },
  },
  "strapi::query",
  {
    name: "strapi::body",
    config: {
      // Reduced from 500MB to reasonable limits for security and memory safety
      // 500MB limits were a DoS vector and could cause memory pressure
      jsonLimit: "10mb",      // JSON API requests (was 500mb)
      formLimit: "50mb",      // Form data (was 500mb)
      textLimit: "10mb",      // Text payloads (was 500mb)
      multipart: true,
      formidable: {
        maxFileSize: 50 * 1024 * 1024, // 50MB for file uploads (was 500MB)
      },
    },
  },
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
  "global::audit-context",
  "global::cache-headers",
];
