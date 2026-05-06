import { formatQueryParams, handleApiError, parseJwt, isTokenExpired } from "../api";
import { ERROR_MESSAGES } from "@/constants/api";

describe("API Utilities", () => {
  describe("formatQueryParams", () => {
    it("returns empty string for empty params", () => {
      expect(formatQueryParams({})).toBe("");
      expect(formatQueryParams(null as any)).toBe("");
      expect(formatQueryParams(undefined as any)).toBe("");
    });

    it("formats single parameter", () => {
      expect(formatQueryParams({ name: "test" })).toBe("?name=test");
    });

    it("formats multiple parameters", () => {
      const params = { name: "test", id: 123, active: true };
      const result = formatQueryParams(params);
      expect(result).toBe("?name=test&id=123&active=true");
    });

    it("filters out null and undefined values", () => {
      const params = {
        name: "test",
        nullValue: null,
        undefinedValue: undefined,
        id: 123,
      };
      const result = formatQueryParams(params);
      expect(result).toBe("?name=test&id=123");
    });

    it("encodes special characters", () => {
      const params = { query: "hello world", special: "test@example.com" };
      const result = formatQueryParams(params);
      expect(result).toBe("?query=hello%20world&special=test%40example.com");
    });

    it("handles zero and false values", () => {
      const params = { count: 0, enabled: false };
      const result = formatQueryParams(params);
      expect(result).toBe("?count=0&enabled=false");
    });
  });

  describe("handleApiError", () => {
    it("handles network errors", () => {
      const networkError = { message: "Network Error" };
      const result = handleApiError(networkError);

      expect(result).toEqual({
        message: ERROR_MESSAGES.NETWORK,
        status: 0,
      });
    });

    it("handles offline errors", () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      const result = handleApiError({ message: "Some error" });

      expect(result).toEqual({
        message: ERROR_MESSAGES.NETWORK,
        status: 0,
      });

      // Restore navigator.onLine
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });
    });

    it("handles timeout errors", () => {
      const timeoutError = { code: "ECONNABORTED" };
      const result = handleApiError(timeoutError);

      expect(result).toEqual({
        message: ERROR_MESSAGES.TIMEOUT,
        status: 408,
      });
    });

    it("handles server response errors", () => {
      const serverError = {
        response: {
          status: 400,
          data: {
            message: "Validation failed",
            errors: { field: ["is required"] },
          },
        },
      };
      const result = handleApiError(serverError);

      expect(result).toEqual({
        message: "Validation failed",
        status: 400,
        errors: { field: ["is required"] },
      });
    });

    it("handles server response without message", () => {
      const serverError = {
        response: {
          status: 500,
          data: {},
        },
      };
      const result = handleApiError(serverError);

      expect(result).toEqual({
        message: ERROR_MESSAGES.DEFAULT,
        status: 500,
        errors: undefined,
      });
    });

    it("handles unknown errors", () => {
      const unknownError = "Something went wrong";
      const result = handleApiError(unknownError);

      expect(result).toEqual({
        message: ERROR_MESSAGES.DEFAULT,
        status: 500,
      });
    });
  });

  describe("parseJwt", () => {
    it("parses valid JWT token", () => {
      // Example JWT token with payload: { sub: "1234567890", name: "John Doe", exp: 1234567890 }
      const validToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxMjM0NTY3ODkwfQ.Gfx6VO9tcxwk6xqx9yYzSfebfeakZp5JYIgP_edcw_A";

      const result = parseJwt(validToken);

      expect(result).toEqual({
        sub: "1234567890",
        name: "John Doe",
        exp: 1234567890,
      });
    });

    it("returns null for invalid token", () => {
      const invalidToken = "invalid.token.here";
      const result = parseJwt(invalidToken);

      expect(result).toBeNull();
    });

    it("returns null for malformed token", () => {
      const malformedToken = "not.a.jwt";
      const result = parseJwt(malformedToken);

      expect(result).toBeNull();
    });

    it("handles token without payload", () => {
      const tokenWithoutPayload = "header..signature";
      const result = parseJwt(tokenWithoutPayload);

      expect(result).toBeNull();
    });
  });

  describe("isTokenExpired", () => {
    beforeEach(() => {
      // Mock Date.now to return a fixed timestamp
      jest.spyOn(Date, "now").mockReturnValue(1600000000000); // Sept 13, 2020
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("returns true for expired token", () => {
      // Token expired in the past (exp: 1500000000 = July 14, 2017)
      const expiredToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxNTAwMDAwMDAwfQ.2_BLoxlMYNJjppAhObPMzJL2QhzXXu9h0X7XPKD4EO8";

      const result = isTokenExpired(expiredToken);

      expect(result).toBe(true);
    });

    it("returns false for valid token", () => {
      // Token expires in the future (exp: 1700000000 = Nov 15, 2023)
      const validToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxNzAwMDAwMDAwfQ.mQqNugTJfN4rCEwZbTdEPM4XLYcbDRfzSfWFyJXeHoI";

      const result = isTokenExpired(validToken);

      expect(result).toBe(false);
    });

    it("returns true for token without exp claim", () => {
      // Token without exp claim
      const tokenWithoutExp =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.Gfx6VO9tcxwk6xqx9yYzSfebfeakZp5JYIgP_edcw_A";

      const result = isTokenExpired(tokenWithoutExp);

      expect(result).toBe(true);
    });

    it("returns true for invalid token", () => {
      const invalidToken = "invalid.token.here";

      const result = isTokenExpired(invalidToken);

      expect(result).toBe(true);
    });

    it("handles edge case where token expires exactly now", () => {
      // Set current time to exactly when token expires
      jest.spyOn(Date, "now").mockReturnValue(1600000000000);

      // Token expires exactly at current time (exp: 1600000000)
      const tokenExpiringNow =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxNjAwMDAwMDAwfQ.Jb7_5h9nW8hQ-5I3W4kgwc5sUYUQk5VhHUJDNdYM8Ek";

      const result = isTokenExpired(tokenExpiringNow);

      expect(result).toBe(false); // Token is still valid at exact expiration time
    });
  });
});
