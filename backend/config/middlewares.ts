export default [
  "strapi::logger",
  "strapi::errors",
  "strapi::security",
  "strapi::poweredBy",
  "strapi::cors",
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
