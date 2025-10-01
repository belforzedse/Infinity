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
  it("should return response data message if available", () => {
    const error = {
      response: {
        data: {
          message: "Custom error message",
        },
      },
    };

    expect(getErrorMessage(error)).toBe("Custom error message");
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

  it("should return error message if it's a string", () => {
    const error = {
      message: "Something went wrong",
    };

    expect(getErrorMessage(error)).toBe("Something went wrong");
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

  it("should prioritize response data message over status", () => {
    const error = {
      response: {
        status: 401,
        data: {
          message: "Specific auth error",
        },
      },
    };

    expect(getErrorMessage(error)).toBe("Specific auth error");
  });

  it("should handle null or undefined error", () => {
    expect(getErrorMessage(null)).toBe(ERROR_MESSAGES.DEFAULT);
    expect(getErrorMessage(undefined)).toBe(ERROR_MESSAGES.DEFAULT);
  });

  it("should handle error with no response", () => {
    const error = {
      message: "Random error",
    };

    expect(getErrorMessage(error)).toBe("Random error");
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
