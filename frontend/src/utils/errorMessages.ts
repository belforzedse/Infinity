import { ERROR_MESSAGES, HTTP_STATUS } from "@/constants/api";

interface ErrorLike {
  message?: string;
  code?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

const STATUS_MESSAGE_MAP: Record<number, string> = {
  [HTTP_STATUS.UNAUTHORIZED]: ERROR_MESSAGES.UNAUTHORIZED,
  [HTTP_STATUS.NOT_FOUND]: ERROR_MESSAGES.NOT_FOUND,
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: ERROR_MESSAGES.DEFAULT,
};

/**
 * Maps a technical error object to a user‑friendly message.
 * Falls back to the provided default message when no match is found.
 */
export const getErrorMessage = (
  error: unknown,
  fallback: string = ERROR_MESSAGES.DEFAULT,
): string => {
  const err = error as ErrorLike | undefined;

  if (err?.response?.data?.message) {
    return err.response.data.message;
  }

  if (err?.response?.status && STATUS_MESSAGE_MAP[err.response.status]) {
    return STATUS_MESSAGE_MAP[err.response.status];
  }

  if (err?.message === "Network Error") {
    return ERROR_MESSAGES.NETWORK;
  }

  if (err?.code === "ECONNABORTED") {
    return ERROR_MESSAGES.TIMEOUT;
  }

  if (typeof err?.message === "string") {
    return err.message;
  }

  return fallback;
};

/**
 * Extracts error message from various error object structures.
 * Handles API errors, Error objects, strings, and nested error properties.
 */
export const extractErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;

    // Direct message property
    if (typeof obj.message === "string") {
      return obj.message;
    }

    // Nested error.message
    if (typeof obj.error === "object" && obj.error !== null) {
      const errorObj = obj.error as Record<string, unknown>;
      if (typeof errorObj.message === "string") {
        return errorObj.message;
      }
    }

    // Nested response.data.message (Axios style)
    if (typeof obj.response === "object" && obj.response !== null) {
      const respObj = obj.response as Record<string, unknown>;
      if (typeof respObj.data === "object" && respObj.data !== null) {
        const dataObj = respObj.data as Record<string, unknown>;
        if (typeof dataObj.message === "string") {
          return dataObj.message;
        }
      }
      if (typeof respObj.message === "string") {
        return respObj.message;
      }
    }
  }

  return "";
};

/**
 * Extracts HTTP status code from error object.
 * Returns the status code if found, otherwise returns 0.
 */
export const extractErrorStatus = (error: unknown): number => {
  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;

    // Direct status property
    if (typeof obj.status === "number") {
      return obj.status;
    }

    // Nested response.status (Axios style)
    if (typeof obj.response === "object" && obj.response !== null) {
      const respObj = obj.response as Record<string, unknown>;
      if (typeof respObj.status === "number") {
        return respObj.status;
      }
    }
  }

  return 0;
};

export default getErrorMessage;
