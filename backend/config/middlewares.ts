export default [
  "strapi::logger",
  "strapi::errors",
  "strapi::security",
  "strapi::poweredBy",
  {
    name: "strapi::cors",
    config: {
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      headers: ["Content-Type", "Authorization", "X-Requested-With"],
    },
  },
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
  "global::audit-context",
];
