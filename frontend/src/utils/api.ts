/**
 * API Utilities
 * Helper functions for API calls
 */

import { ApiError } from "@/types/api";
import { ERROR_MESSAGES } from "@/constants/api";

/**
 * Format query parameters for URL
 */
export const formatQueryParams = (params: Record<string, any>): string => {
  if (!params || Object.keys(params).length === 0) {
    return "";
  }

  const queryParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    )
    .join("&");

  return queryParams ? `?${queryParams}` : "";
};

/**
 * Handle API errors and return a standardized error object
 */
export const handleApiError = (error: any): ApiError => {
  // Network error
  if (error.message === "Network Error" || !navigator.onLine) {
    return {
      message: ERROR_MESSAGES.NETWORK,
      status: 0,
    };
  }

  // Timeout error
  if (error.code === "ECONNABORTED") {
    return {
      message: ERROR_MESSAGES.TIMEOUT,
      status: 408,
    };
  }

  // Server returned an error
  if (error.response) {
    const { status, data } = error.response;

    return {
      message: data.message || ERROR_MESSAGES.DEFAULT,
      status,
      errors: data.errors,
    };
  }

  // Default error
  return {
    message: ERROR_MESSAGES.DEFAULT,
    status: 500,
  };
};

/**
 * Parse JWT token and extract payload
 */
export const parseJwt = (token: string): any => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error parsing JWT token:", error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const decodedToken = parseJwt(token);

  if (!decodedToken || !decodedToken.exp) {
    return true;
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = decodedToken.exp * 1000;
  const currentTime = Date.now();

  return currentTime > expirationTime;
};
