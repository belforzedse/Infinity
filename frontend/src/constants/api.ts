/**
 * API Constants
 * This file contains all the constants related to API calls
 */
// Base URLs
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
export const STRAPI_TOKEN =
  process.env.NEXT_PUBLIC_STRAPI_TOKEN;
export const IMAGE_BASE_URL =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL || DEFAULT_IMAGE_BASE_URL;

/**
 * Internal Strapi URL for server-side calls at runtime (e.g. in Docker container).
 * Bypasses TLS + public Nginx + DNS when frontend and backend are on the same host.
 *
 * DOCKER: 127.0.0.1 inside a container = the container itself, NOT the host.
 * Use host.docker.internal:8080 so the container reaches the host's port 8080.
 * Nginx on the host can use upstream 127.0.0.1:8080 (Strapi); the container
 * using host.docker.internal:8080 hits the same host port, so it's compatible.
 * On Linux add extra_hosts: host.docker.internal:host-gateway if needed.
 */
export const STRAPI_INTERNAL_URL =
  typeof window === "undefined"
    ? (process.env.STRAPI_INTERNAL_URL || API_BASE_URL)
    : API_BASE_URL;

/**
 * Returns the Strapi base URL for server-side fetches. Use this instead of
 * STRAPI_INTERNAL_URL so build and runtime can use different URLs.
 *
 * Next.js 16: process.env is replaced at build time for static references, so
 * we read env inside a function. When Server Components run during `next build`
 * (static generation), this sees build env (e.g. STRAPI_BUILD_TIME_URL in CI).
 * When they run at request time (revalidate, dynamic), this sees runtime env
 * (e.g. STRAPI_INTERNAL_URL in the container). See Next.js 16 env docs and
 * connection() for reading env at request time if needed.
 *
 * Priority: STRAPI_BUILD_TIME_URL > STRAPI_INTERNAL_URL > API_BASE_URL
 * - Build (CI / Docker build): set STRAPI_BUILD_TIME_URL to public API URL.
 * - Runtime (container): set STRAPI_INTERNAL_URL; leave STRAPI_BUILD_TIME_URL unset.
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
// API Versions
export const API_VERSION = "v1";


// Request Timeout (in milliseconds)
// 45s to allow slow API/upstream; retries handle transient issues
export const REQUEST_TIMEOUT = 45000; // 45 seconds
// Faster timeout profile for checkout-critical reads to reduce long-tail loading
export const CHECKOUT_REQUEST_TIMEOUT_MS = 10000;
export const CHECKOUT_MAX_RETRIES = 1;
// Maximum time the fullscreen global overlay can block interactions
export const GLOBAL_OVERLAY_MAX_BLOCKING_MS = 6000;

// Retry Configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second base delay
  maxDelay: 10000, // 10 seconds max delay
  retryableStatusCodes: [408, 429, 500, 502, 503, 504], // Retry on these status codes
};

// API Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH: {
    EXISTS: "/auth/welcome",
    SEND_OTP: "/auth/otp",
    VERIFY_OTP: "/auth/login",
    LOGIN_OTP: "/auth/login-otp",
    RESET_PASSWORD: "/auth/reset-password",
    REGISTER: "/auth/register-info",
    LOGIN_PASSWORD: "/auth/login-with-password",
  },
  USER: {
    ME: "/auth/self",
    GET_ALL: "/users",
    GET_DETAILS: "/users",
    GET_INFO: "/user/info/by/user",
  },
  PRODUCT: {
    TAG: "/product-tags",
    CATEGORY: "/product-categories",
    PRODUCT: "/products",
    COLORS: "/product-variation-colors",
    SIZE_HELPER: "/product-size-helpers",
    REVIEWS: {
      SUBMIT: "/product-reviews/submit",
    },
    SEARCH: "/products/search",
  },
  PRODUCT_LIKES: {
    TOGGLE: "/product-likes/toggle",
    USER_LIKES: "/product-likes/user/me",
  },
  FAQ: {
    CATEGORY: "/faq-categories",
    QUESTION: "/faq-questions",
  },
  STORIES: {
    LIST: "/stories",
    ACTIVE: "/stories/active",
    DETAIL: (id: number) => `/stories/${id}`,
    SEEN_MARK: "/story-seens/mark",
    SEEN_MINE: "/story-seens/mine",
  },
  FILE: {
    UPLOAD: "/upload",
    DOWNLOAD: "/upload/files",
  },
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Error Messages (all in Persian; vague errors include "دوباره تلاش کنید")
export const ERROR_MESSAGES = {
  DEFAULT: "متأسفانه مشکلی پیش آمد. دوباره تلاش کنید.",
  NETWORK: "خطای شبکه. اتصال اینترنت خود را بررسی کنید.",
  TIMEOUT: "زمان درخواست به پایان رسید. دوباره تلاش کنید.",
  UNAUTHORIZED: "احراز هویت نشده‌اید. دوباره تلاش کنید.",
  NOT_FOUND: "موردی یافت نشد. دوباره تلاش کنید.",
};
