/**
 * API Constants
 * This file contains all the constants related to API calls
 */
// Base URLs
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:1337/api";
export const STRAPI_TOKEN =
  process.env.NEXT_PUBLIC_STRAPI_TOKEN;
export const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "http://localhost:1337";
// API Versions
export const API_VERSION = "v1";


// Request Timeout (in milliseconds)
// Reduced to 30s with retry logic for better UX
// Retries handle transient network issues
export const REQUEST_TIMEOUT = 30000; // 30 seconds

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
