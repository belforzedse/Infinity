/**
 * API Utilities — query strings, JWT helpers, normalized ApiError from unknown errors.
 */

import type { ApiError } from "../types/api";
import type { ErrorMessages } from "../config/public";

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

export const formatQueryParams = (params: QueryParams): string => {
  if (!params || Object.keys(params).length === 0) {
    return "";
  }

  const queryParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");

  return queryParams ? `?${queryParams}` : "";
};

export const handleApiError = (
  error: unknown,
  messages: Pick<ErrorMessages, "DEFAULT" | "NETWORK" | "TIMEOUT">,
): ApiError => {
  const err = error as ErrorLike;
  if (err.message === "Network Error" || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return {
      message: messages.NETWORK,
      status: 0,
    };
  }

  if (err.code === "ECONNABORTED") {
    return {
      message: messages.TIMEOUT,
      status: 408,
    };
  }

  if (err.response) {
    const { status, data } = err.response;

    return {
      message: data.message || messages.DEFAULT,
      status,
      errors: data.errors as Record<string, string[]> | undefined,
    };
  }

  return {
    message: messages.DEFAULT,
    status: 500,
  };
};

export const parseJwt = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
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

export const isTokenExpired = (token: string): boolean => {
  const decodedToken = parseJwt(token);

  if (!decodedToken || !decodedToken.exp) {
    return true;
  }

  const expirationTime = decodedToken.exp * 1000;
  const currentTime = Date.now();

  return currentTime > expirationTime;
};
