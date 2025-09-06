/**
 * API Utilities
 * Helper functions for API calls
 */

import type { ApiError } from "../types/api";
import { ERROR_MESSAGES } from "../constants/api";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

interface ErrorLike {
  message?: string;
  code?: string;
  response?: {
    status: number;
    data: {
      message?: string;
      errors?: unknown;
    };
  };
}

export interface JwtPayload {
  exp?: number;
  [key: string]: unknown;
}

/**
 * Format query parameters for URL
 */
export const formatQueryParams = (params: QueryParams): string => {
  if (!params || Object.keys(params).length === 0) {
    return "";
  }

  const queryParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");

  return queryParams ? `?${queryParams}` : "";
};

/**
 * Handle API errors and return a standardized error object
 */
export const handleApiError = (error: unknown): ApiError => {
  const err = error as ErrorLike;
  // Network error
  if (
    err.message === "Network Error" ||
    (typeof navigator !== "undefined" && !navigator.onLine)
  ) {
    return {
      message: ERROR_MESSAGES.NETWORK,
      status: 0,
    };
  }

  // Timeout error
  if (err.code === "ECONNABORTED") {
    return {
      message: ERROR_MESSAGES.TIMEOUT,
      status: 408,
    };
  }

  // Server returned an error
  if (err.response) {
    const { status, data } = err.response;

    return {
      message: data.message || ERROR_MESSAGES.DEFAULT,
      status,
      errors: data.errors as Record<string, string[]> | undefined,
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
export const parseJwt = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const decodedString =
      typeof window === "undefined"
        ? Buffer.from(base64, "base64").toString("binary")
        : atob(base64);

    const jsonPayload = decodeURIComponent(
      decodedString
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );

    return JSON.parse(jsonPayload) as JwtPayload;
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
