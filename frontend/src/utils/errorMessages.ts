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

export default getErrorMessage;
