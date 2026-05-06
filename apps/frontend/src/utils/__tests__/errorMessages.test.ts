import { getErrorMessage } from "../errorMessages";
import { ERROR_MESSAGES, HTTP_STATUS } from "@/constants/api";

// Mock the constants
jest.mock("@/constants/api", () => ({
  ERROR_MESSAGES: {
    DEFAULT: "خطای پیش‌بینی نشده",
    UNAUTHORIZED: "دسترسی غیرمجاز",
    NOT_FOUND: "یافت نشد",
    NETWORK: "خطای شبکه",
    TIMEOUT: "زمان درخواست تمام شد",
  },
  HTTP_STATUS: {
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
}));

describe("getErrorMessage", () => {
  it("should return translated message for response data message (English → Persian or fallback)", () => {
    const error = {
      response: {
        data: {
          message: "Custom error message",
        },
      },
    };
    // getErrorMessage delegates to getUserFacingErrorMessage; unknown English uses fallback
    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.DEFAULT);
  });

  it("should return status-specific message for 401", () => {
    const error = {
      response: {
        status: 401,
      },
    };

    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.UNAUTHORIZED);
  });

  it("should return status-specific message for 404", () => {
    const error = {
      response: {
        status: 404,
      },
    };

    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.NOT_FOUND);
  });

  it("should return status-specific message for 500", () => {
    const error = {
      response: {
        status: 500,
      },
    };

    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.DEFAULT);
  });

  it("should return network error message for Network Error", () => {
    const error = {
      message: "Network Error",
    };

    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.NETWORK);
  });

  it("should return timeout message for ECONNABORTED", () => {
    const error = {
      code: "ECONNABORTED",
    };

    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.TIMEOUT);
  });

  it("should return translated message for known English strings", () => {
    const error = {
      message: "Something went wrong",
    };
    // "something went wrong" is in ERROR_MESSAGE_MAP → Persian
    expect(getErrorMessage(error)).toBe("متأسفانه مشکلی پیش آمد. دوباره تلاش کنید.");
  });

  it("should return default fallback for unknown errors", () => {
    const error = {};

    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.DEFAULT);
  });

  it("should return custom fallback when provided", () => {
    const error = {};
    const customFallback = "Custom fallback message";

    expect(getErrorMessage(error, customFallback)).toBe(customFallback);
  });

  it("should prioritize status mapping over response body when status is mapped", () => {
    const error = {
      response: {
        status: 401,
        data: {
          message: "Specific auth error",
        },
      },
    };
    // Status is checked first; 401 → UNAUTHORIZED
    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.UNAUTHORIZED);
  });

  it("should handle null or undefined error", () => {
    expect(getErrorMessage(null)).toBe(ERROR_MESSAGES.DEFAULT);
    expect(getErrorMessage(undefined)).toBe(ERROR_MESSAGES.DEFAULT);
  });

  it("should return fallback for unmapped error message", () => {
    const error = {
      message: "Random error",
    };
    // Unknown English message → fallback (safe for UI)
    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.DEFAULT);
  });

  it("should handle errors with non-mapped status codes", () => {
    const error = {
      response: {
        status: 418, // I'm a teapot
      },
    };

    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.DEFAULT);
  });

  it("should handle error objects without message property", () => {
    const error = {
      code: "UNKNOWN_ERROR",
    };

    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.DEFAULT);
  });
});
