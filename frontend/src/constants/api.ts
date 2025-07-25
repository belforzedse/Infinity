/**
 * API Constants
 * This file contains all the constants related to API calls
 */

// Base URLs
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://infinity-bck.darkube.app/api";

export const STRAPI_TOKEN =
  process.env.NEXT_PUBLIC_STRAPI_TOKEN ||
  "5ded48b60050770a36fd985fdef2a20b971cd82f26e2e8bc02d38b4fb52258c1ace5049f2bc82b8d336dd20b88d6af9bc826c49a465e4698042fac690650f70a663d357e9bc52e8a6c9cc4a5de7075e07472c6a6d55f0c9a29690a3e6717000c61bb9ba085c233311c9d7e7e1f8f3ab3ff6985a5fd7f2f4ede73204761451fd6";

export const IMAGE_BASE_URL = "https://infinity-bck.darkube.app";

// API Versions
export const API_VERSION = "v1";

// Request Timeout (in milliseconds)
export const REQUEST_TIMEOUT = 30000; // 30 seconds

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
    GET_ALL: "/local-users",
    GET_DETAILS: "/local-users",
    GET_INFO: "/user/info/by/user",
  },
  PRODUCT: {
    TAG: "/product-tags",
    CATEGORY: "/product-categories",
    PRODUCT: "/products",
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

// Error Messages
export const ERROR_MESSAGES = {
  DEFAULT: "Something went wrong. Please try again later.",
  NETWORK: "Network error. Please check your internet connection.",
  TIMEOUT: "Request timed out. Please try again.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
};
