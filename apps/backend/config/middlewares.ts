const frontendUrl = process.env.FRONTEND_URL || process.env.FRONTEND_BASE_URL || "https://infinitycolor.co";
const corsOrigins = [
  frontendUrl.replace(/\/$/, ""),
  "https://new.infinitycolor.co",
  "https://infinitycolor.co",
  "https://infinitygram.co",
  "http://localhost:2888",
  "http://127.0.0.1:2888",
  // @repo/social (`next dev -p 2890`)
  "http://localhost:2890",
  "http://127.0.0.1:2890",
].filter((origin, i, arr) => arr.indexOf(origin) === i); // dedupe

const allowedOriginsSet = new Set(corsOrigins);

/** Max multipart upload size (bytes). Override with STRAPI_MAX_UPLOAD_SIZE_MB (default 256). */
const maxUploadBytes =
  (Number.parseInt(process.env.STRAPI_MAX_UPLOAD_SIZE_MB ?? "256", 10) || 256) * 1024 * 1024;
const maxUploadLabel = `${Math.round(maxUploadBytes / 1024 / 1024)}mb`;

export default [
  "strapi::logger",
  "strapi::errors",
  // Merge duplicate slashes before static-serving/routing so malformed paths like
  // `//rest-cache/config/strategy` (from third-party admin plugins) route instead of 400-ing.
  "global::normalize-path",
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
      headers: [
        "Content-Type",
        "Authorization",
        "Origin",
        "Accept",
        "Accept-Language",
        "x-skip-global-loader",
      ],
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
      formLimit: maxUploadLabel, // multipart forms — must fit max video upload
      textLimit: "10mb",      // Text payloads (was 500mb)
      multipart: true,
      formidable: {
        maxFileSize: maxUploadBytes,
      },
    },
  },
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
  "global::audit-context",
  "global::cache-headers",
];
