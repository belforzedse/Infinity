const frontendUrl = process.env.FRONTEND_URL || process.env.FRONTEND_BASE_URL || "https://infinitycolor.co";
const corsOrigins = [
  frontendUrl.replace(/\/$/, ""),
  "http://localhost:2888",
  "http://127.0.0.1:2888",
];

export default [
  "strapi::logger",
  "strapi::errors",
  "strapi::security",
  "strapi::poweredBy",
  {
    name: "strapi::cors",
    config: {
      origin: corsOrigins,
      credentials: true,
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
