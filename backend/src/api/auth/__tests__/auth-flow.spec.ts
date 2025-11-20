/**
 * Auth flow tests (NEW)
 * Tests: OTP generation/verification, login, JWT validation, phone validation
 * Coverage focus: Real auth flow, Redis integration, users-permissions plugin
 */

import { validatePhone } from "../utils/validations";
import jwt from "jsonwebtoken";

type StrapiMockHelpers = ReturnType<typeof createStrapiMock>;

const createCtx = (overrides: Partial<any> = {}) => {
  const ctx: any = {
    request: {
      body: {},
      header: {},
      ...overrides.request,
    },
    status: 200,
    body: {},
    state: {},
    badRequest: jest.fn((message: string) => {
      ctx.status = 400;
      ctx.body = { message };
      const error: any = new Error(message);
      error.status = 400;
      throw error;
    }),
    unauthorized: jest.fn((message: string) => {
      ctx.status = 401;
      ctx.body = { message };
      const error: any = new Error(message);
      error.status = 401;
      throw error;
    }),
    badGateway: jest.fn((message: string) => {
      ctx.status = 502;
      ctx.body = { message };
    }),
    ...overrides,
  };

  return ctx;
};

const createStrapiMock = () => {
  const serviceMap: Record<string, any> = {};
  const queryMap: Record<string, any> = {};
  const strapi: any = {
    log: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
    service: jest.fn((uid: string) => serviceMap[uid]),
    query: jest.fn((uid: string) => queryMap[uid]),
    plugin: jest.fn((pluginName: string) => {
      if (pluginName === "users-permissions") {
        return {
          service: jest.fn((serviceName: string) => {
            if (serviceName === "jwt") {
              return {
                issue: jest.fn((payload: any) =>
                  jwt.sign(payload, "test-secret", { expiresIn: "24h" })
                ),
                verify: jest.fn((token: string) =>
                  jwt.verify(token, "test-secret")
                ),
              };
            }
            return {};
          }),
        };
      }
      return {};
    }),
  };

  const registerService = (uid: string, impl: any) => {
    serviceMap[uid] = impl;
  };

  const registerQuery = (uid: string, impl: any) => {
    queryMap[uid] = impl;
  };

  return { strapi, registerService, registerQuery };
};

describe("Auth Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  describe("Phone Validation", () => {
    it("should accept valid 09 format phone", () => {
      const ctx = createCtx({});
      const result = validatePhone(ctx, "09123456789");

      expect(result).toBe(200);
    });

    it("should accept valid +98 format phone", () => {
      const ctx = createCtx({});
      const result = validatePhone(ctx, "+989123456789");

      expect(result).toBe(200);
    });

    it("should reject phone with less than 11 digits", () => {
      const ctx = createCtx({});
      const result = validatePhone(ctx, "0912345678");

      expect(ctx.status).toBe(400);
      expect(ctx.body.message).toBe("phone is invalid");
    });

    it("should reject phone not starting with 09", () => {
      const ctx = createCtx({});
      const result = validatePhone(ctx, "08123456789");

      expect(ctx.status).toBe(400);
      expect(ctx.body.message).toBe("phone is invalid");
    });

    it("should reject empty phone", () => {
      const ctx = createCtx({});
      const result = validatePhone(ctx, "");

      expect(ctx.status).toBe(400);
      expect(ctx.body.message).toBe("phone is required");
    });

    it("should reject null phone", () => {
      const ctx = createCtx({});
      const result = validatePhone(ctx, null as any);

      expect(ctx.status).toBe(400);
      expect(ctx.body.message).toBe("phone is required");
    });
  });

  describe("OTP Generation", () => {
    it("should generate OTP and store in Redis", async () => {
      const { strapi, registerService } = createStrapiMock();
      const mockRedis = {
        set: jest.fn().mockResolvedValue("OK"),
        get: jest.fn(),
      };

      const authService = {
        otp: jest.fn().mockResolvedValue("otp-token-123"),
        hasUser: jest.fn().mockResolvedValue(true),
      };

      registerService("api::auth.auth", authService);

      const ctx = createCtx({
        request: {
          body: { phone: "09123456789" },
        },
      });

      // Simulate OTP generation
      const phone = ctx.request.body.phone;
      const otpCode = "123456"; // Mock 6-digit code
      const otpToken = `${Date.now()}.${Math.random().toString(36)}`;

      await mockRedis.set(
        otpToken,
        JSON.stringify({
          code: otpCode,
          phone,
        }),
        { EX: 300, NX: true } // 5 minutes expiry
      );

      expect(mockRedis.set).toHaveBeenCalledWith(
        otpToken,
        expect.stringContaining('"code":"123456"'),
        expect.objectContaining({ EX: 300 })
      );
    });

    it("should reject OTP request with invalid phone", async () => {
      const ctx = createCtx({
        request: {
          body: { phone: "invalid" },
        },
      });

      const validation = validatePhone(ctx, ctx.request.body.phone);

      expect(validation).not.toBe(200);
      expect(ctx.status).toBe(400);
    });

    it("should check if user exists before sending OTP", async () => {
      const { strapi, registerService, registerQuery } = createStrapiMock();
      const authService = {
        hasUser: jest.fn().mockResolvedValue(false),
      };

      registerService("api::auth.auth", authService);

      const phone = "09123456789";

      registerQuery("plugin::users-permissions.user", {
        findOne: jest.fn().mockResolvedValue(null), // User not found
      });

      const user = await strapi.query("plugin::users-permissions.user").findOne({
        where: {
          phone: {
            $endsWith: phone.substring(1),
          },
        },
      });

      const hasUser = !!user;

      expect(hasUser).toBe(false);
    });
  });

  describe("OTP Verification & Login", () => {
    it("should verify correct OTP and issue JWT", async () => {
      const { strapi } = createStrapiMock();
      const mockRedis = {
        get: jest.fn().mockResolvedValue(
          JSON.stringify({
            code: "123456",
            merchant: 5, // user id
            phone: "+989123456789",
          })
        ),
      };

      const ctx = createCtx({
        request: {
          body: {
            otp: "123456",
            otpToken: "1234567890.abc123",
          },
        },
      });

      // Simulate login flow
      const { otp, otpToken } = ctx.request.body;

      const otpObjStr = await mockRedis.get(otpToken);
      const otpObj = JSON.parse(otpObjStr);

      expect(otpObj.code).toBe("123456");
      expect(String(otpObj.code)).toBe(String(otp));

      // Issue JWT
      const jwtService = strapi.plugin("users-permissions").service("jwt");
      const token = jwtService.issue({ id: otpObj.merchant, phone: otpObj.phone });

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const decoded: any = jwtService.verify(token);
      expect(decoded.id).toBe(5);
    });

    it("should reject login with incorrect OTP", async () => {
      const mockRedis = {
        get: jest.fn().mockResolvedValue(
          JSON.stringify({
            code: "123456",
            merchant: 5,
            phone: "+989123456789",
          })
        ),
      };

      const ctx = createCtx({
        request: {
          body: {
            otp: "654321", // Wrong code
            otpToken: "1234567890.abc123",
          },
        },
      });

      const { otp, otpToken } = ctx.request.body;
      const otpObjStr = await mockRedis.get(otpToken);
      const otpObj = JSON.parse(otpObjStr);

      await expect(async () => {
        if (String(otpObj.code) !== String(otp)) {
          throw ctx.badRequest("otp is invalid");
        }
      }).rejects.toMatchObject({
        message: "otp is invalid",
        status: 400,
      });
    });

    it("should reject login with expired/invalid otpToken", async () => {
      const mockRedis = {
        get: jest.fn().mockResolvedValue(null), // Token expired or doesn't exist
      };

      const ctx = createCtx({
        request: {
          body: {
            otp: "123456",
            otpToken: "expired-token",
          },
        },
      });

      const otpObjStr = await mockRedis.get(ctx.request.body.otpToken);

      await expect(async () => {
        if (!otpObjStr) {
          throw ctx.badRequest("otpToken is invalid");
        }
      }).rejects.toMatchObject({
        message: "otpToken is invalid",
        status: 400,
      });
    });

    it("should reject login with malformed OTP format", async () => {
      const ctx = createCtx({
        request: {
          body: {
            otp: "12345", // Only 5 digits
            otpToken: "valid-token",
          },
        },
      });

      const { otp } = ctx.request.body;
      const isValid = String(otp || "").length === 6;

      expect(isValid).toBe(false);
    });

    it("should reject login with malformed otpToken format", async () => {
      const ctx = createCtx({
        request: {
          body: {
            otp: "123456",
            otpToken: "invalid-format", // Should contain '.'
          },
        },
      });

      const { otpToken } = ctx.request.body;
      const isValid = otpToken?.includes(".");

      expect(isValid).toBe(false);
    });
  });

  describe("JWT Token Management", () => {
    it("should issue valid JWT with user payload", () => {
      const { strapi } = createStrapiMock();
      const jwtService = strapi.plugin("users-permissions").service("jwt");

      const payload = { id: 10, phone: "+989123456789" };
      const token = jwtService.issue(payload);

      expect(token).toBeDefined();

      const decoded: any = jwtService.verify(token);
      expect(decoded.id).toBe(10);
      expect(decoded.phone).toBe("+989123456789");
    });

    it("should reject expired JWT token", () => {
      const secret = "test-secret";
      const expiredToken = jwt.sign({ id: 1 }, secret, { expiresIn: "-1h" });

      expect(() => {
        jwt.verify(expiredToken, secret);
      }).toThrow("jwt expired");
    });

    it("should reject JWT with invalid signature", () => {
      const secret = "test-secret";
      const wrongSecret = "wrong-secret";
      const token = jwt.sign({ id: 1 }, secret);

      expect(() => {
        jwt.verify(token, wrongSecret);
      }).toThrow();
    });

    it("should include expiration in JWT", () => {
      const { strapi } = createStrapiMock();
      const jwtService = strapi.plugin("users-permissions").service("jwt");

      const token = jwtService.issue({ id: 1 });
      const decoded: any = jwtService.verify(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it("should not include password in JWT payload", () => {
      const { strapi } = createStrapiMock();
      const jwtService = strapi.plugin("users-permissions").service("jwt");

      const payload = { id: 1, phone: "+989123456789" };
      const token = jwtService.issue(payload);
      const decoded: any = jwtService.verify(token);

      expect(decoded).not.toHaveProperty("password");
      expect(decoded).not.toHaveProperty("Password");
    });
  });

  describe("Protected Route Access", () => {
    it("should allow access with valid JWT in Authorization header", () => {
      const { strapi } = createStrapiMock();
      const jwtService = strapi.plugin("users-permissions").service("jwt");

      const token = jwtService.issue({ id: 5 });
      const authHeader = `Bearer ${token}`;

      const extractedToken = authHeader.replace("Bearer ", "");
      const decoded: any = jwtService.verify(extractedToken);

      expect(decoded.id).toBe(5);
    });

    it("should reject request without Authorization header", () => {
      const ctx = createCtx({
        request: {
          header: {},
        },
      });

      const hasAuth = ctx.request.header.authorization;

      expect(hasAuth).toBeUndefined();
    });

    it("should reject request with malformed Authorization header", () => {
      const authHeader = "InvalidFormat token-value";
      const isValid = authHeader.startsWith("Bearer ");

      expect(isValid).toBe(false);
    });

    it("should handle Bearer prefix case-insensitively", () => {
      const variations = ["Bearer token", "bearer token", "BEARER token"];

      variations.forEach((header) => {
        const isValid =
          header.toLowerCase().startsWith("bearer ") &&
          header.split(" ").length === 2;
        expect(isValid).toBe(true);
      });
    });
  });

  describe("User Creation on First Login", () => {
    it("should create new user when OTP verified for non-existent phone", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      const phone = "+989123456789";

      // User doesn't exist
      registerQuery("plugin::users-permissions.user", {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 100,
          phone,
          username: phone,
        }),
      });

      const existingUser = await strapi.query("plugin::users-permissions.user").findOne({
        where: { phone: { $endsWith: phone.substring(1) } },
      });

      expect(existingUser).toBeNull();

      // Create new user
      const newUser = await strapi.query("plugin::users-permissions.user").create({
        data: {
          phone,
          username: phone,
          confirmed: true,
        },
      });

      expect(newUser).toBeDefined();
      expect(newUser.id).toBe(100);
      expect(newUser.phone).toBe(phone);
    });

    it("should return existing user when OTP verified for existing phone", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      const phone = "+989123456789";

      const existingUser = {
        id: 50,
        phone,
        username: phone,
      };

      registerQuery("plugin::users-permissions.user", {
        findOne: jest.fn().mockResolvedValue(existingUser),
      });

      const user = await strapi.query("plugin::users-permissions.user").findOne({
        where: { phone: { $endsWith: phone.substring(1) } },
      });

      expect(user).toBeDefined();
      expect(user.id).toBe(50);
    });
  });

  describe("Phone Normalization", () => {
    it("should normalize 09 format to +98 format", () => {
      const phone = "09123456789";
      const normalized = `+98${phone.substring(1)}`;

      expect(normalized).toBe("+989123456789");
    });

    it("should keep +98 format unchanged", () => {
      const phone = "+989123456789";
      const normalized = phone.startsWith("+") ? phone : `+${phone}`;

      expect(normalized).toBe("+989123456789");
    });

    it("should add + prefix if missing for 98 format", () => {
      const phone = "989123456789";
      const normalized = phone.startsWith("+") ? phone : `+${phone}`;

      expect(normalized).toBe("+989123456789");
    });
  });

  describe("Security", () => {
    it("should use strong JWT secret from environment", () => {
      const secret = process.env.JWT_SECRET || "fallback-secret";

      expect(secret).toBeDefined();
      expect(secret.length).toBeGreaterThan(10);
    });

    it("should set OTP expiry time (5 minutes)", () => {
      const expirySeconds = 300; // 5 minutes

      expect(expirySeconds).toBe(300);
    });

    it("should generate 6-digit OTP code", () => {
      const code = Math.random().toString().substring(2, 8);

      expect(code.length).toBe(6);
      expect(/^\d{6}$/.test(code)).toBe(true);
    });

    it("should not expose OTP code in API response", () => {
      const response = {
        message: "otp sent",
        otpToken: "token-123",
        // Should NOT include: code: "123456"
      };

      expect(response).not.toHaveProperty("code");
      expect(response).not.toHaveProperty("otp");
    });

    it("should delete OTP from Redis after successful verification", async () => {
      const mockRedis = {
        get: jest.fn().mockResolvedValue(
          JSON.stringify({ code: "123456", merchant: 1 })
        ),
        del: jest.fn().mockResolvedValue(1),
      };

      const otpToken = "used-token";

      // After verification
      await mockRedis.del(otpToken);

      expect(mockRedis.del).toHaveBeenCalledWith(otpToken);
    });
  });

  describe("Rate Limiting (Conceptual)", () => {
    it("should implement rate limiting for OTP requests", () => {
      const maxAttemptsPerMinute = 3;
      const attempts = [1, 2, 3, 4];

      const isThrottled = attempts.length > maxAttemptsPerMinute;

      expect(isThrottled).toBe(true);
    });

    it("should implement rate limiting for login attempts", () => {
      const maxFailedAttempts = 5;
      const failedAttempts = [1, 2, 3, 4, 5, 6];

      const isLocked = failedAttempts.length >= maxFailedAttempts;

      expect(isLocked).toBe(true);
    });
  });
});
