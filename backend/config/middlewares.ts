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
      jsonLimit: "500mb",
      formLimit: "500mb",
      textLimit: "500mb",
      multipart: true,
      formidable: {
        maxFileSize: 500 * 1024 * 1024, // 500MB cap to avoid parser rejection
      },
    },
  },
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
  "global::audit-context",
  "global::cache-headers",
];
