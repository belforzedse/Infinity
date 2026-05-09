/**
 * Public API URL and request tuning shared by frontend apps (Next.js env).
 * Domain-specific endpoint paths belong in each app, not here.
 */

const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.infinitycolor.co/api"
    : "http://localhost:1337/api";
const DEFAULT_IMAGE_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.infinitycolor.co"
    : "http://localhost:1337";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;
export const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_TOKEN;
export const IMAGE_BASE_URL =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL || DEFAULT_IMAGE_BASE_URL;

/**
 * Internal Strapi URL for server-side calls at runtime (e.g. in Docker).
 */
export const STRAPI_INTERNAL_URL =
  typeof window === "undefined"
    ? (process.env.STRAPI_INTERNAL_URL || API_BASE_URL)
    : API_BASE_URL;

/**
 * Strapi base URL for server-side fetches; build vs runtime via env (Next.js 16).
 * Priority: STRAPI_BUILD_TIME_URL > STRAPI_INTERNAL_URL > API_BASE_URL
 */
export function getStrapiServerUrl(): string {
  if (typeof window !== "undefined") return API_BASE_URL;
  return (
    process.env.STRAPI_BUILD_TIME_URL ||
    process.env.STRAPI_INTERNAL_URL ||
    API_BASE_URL
  );
}

/** @deprecated Use getStrapiServerUrl() so build vs runtime URL works correctly. */
export const STRAPI_SERVER_URL =
  typeof window === "undefined"
    ? (process.env.STRAPI_BUILD_TIME_URL ||
        process.env.STRAPI_INTERNAL_URL ||
        API_BASE_URL)
    : API_BASE_URL;

export const API_VERSION = "v1";

/** Default request timeout (ms) for ApiClient */
export const REQUEST_TIMEOUT = 45000;

export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504] as const,
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/** Persian defaults; apps may pass their own copy to helpers if needed */
export const ERROR_MESSAGES = {
  DEFAULT: "متأسفانه مشکلی پیش آمد. دوباره تلاش کنید.",
  NETWORK: "خطای شبکه. اتصال اینترنت خود را بررسی کنید.",
  TIMEOUT: "زمان درخواست به پایان رسید. دوباره تلاش کنید.",
  UNAUTHORIZED: "احراز هویت نشده‌اید. دوباره تلاش کنید.",
  NOT_FOUND: "موردی یافت نشد. دوباره تلاش کنید.",
} as const;

export type ErrorMessages = typeof ERROR_MESSAGES;
