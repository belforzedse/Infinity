/**
 * API constants for the storefront.
 * Shared URL/env helpers live in `@repo/api`; domain endpoint paths stay here.
 */
export {
  API_BASE_URL,
  STRAPI_TOKEN,
  IMAGE_BASE_URL,
  STRAPI_INTERNAL_URL,
  getStrapiServerUrl,
  STRAPI_SERVER_URL,
  API_VERSION,
  REQUEST_TIMEOUT,
  RETRY_CONFIG,
  HTTP_STATUS,
  ERROR_MESSAGES,
} from "@repo/api/config";

// Faster timeout profile for checkout-critical reads to reduce long-tail loading
export const CHECKOUT_REQUEST_TIMEOUT_MS = 10000;
export const CHECKOUT_MAX_RETRIES = 1;
// Maximum time the fullscreen global overlay can block interactions
export const GLOBAL_OVERLAY_MAX_BLOCKING_MS = 6000;

// API Endpoints (storefront / e-commerce domain)
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
