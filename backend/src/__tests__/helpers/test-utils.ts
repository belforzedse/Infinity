/**
 * Shared test utilities
 * Reusable mocking helpers for all test files
 */

import jwt from "jsonwebtoken";

export type StrapiMockHelpers = ReturnType<typeof createStrapiMock>;

export const createCtx = (overrides: Partial<any> = {}) => {
  const ctx: any = {
    request: {
      body: {},
      header: {},
      ...overrides.request,
    },
    query: {},
    params: {},
    status: 200,
    body: {},
    state: {
      user: { id: 1, role: { type: "authenticated" } },
      ...overrides.state,
    },
    badRequest: jest.fn((message: string, payload?: unknown) => {
      const error: any = new Error(message);
      error.status = 400;
      error.payload = payload;
      throw error;
    }),
    unauthorized: jest.fn((message: string, payload?: unknown) => {
      const error: any = new Error(message);
      error.status = 401;
      error.payload = payload;
      throw error;
    }),
    forbidden: jest.fn((message: string, payload?: unknown) => {
      const error: any = new Error(message);
      error.status = 403;
      error.payload = payload;
      throw error;
    }),
    notFound: jest.fn((message: string, payload?: unknown) => {
      const error: any = new Error(message);
      error.status = 404;
      error.payload = payload;
      throw error;
    }),
    badGateway: jest.fn((message: string) => {
      const error: any = new Error(message);
      error.status = 502;
      throw error;
    }),
    redirect: jest.fn(),
    send: jest.fn((data: any) => data),
    ...overrides,
  };

  return ctx;
};

export const createStrapiMock = () => {
  const serviceMap: Record<string, any> = {};
  const queryMap: Record<string, any> = {};
  const strapi: any = {
    log: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
    entityService: {
      findOne: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
    },
    service: jest.fn((uid: string) => serviceMap[uid]),
    query: jest.fn((uid: string) => queryMap[uid]),
    db: {
      query: jest.fn((uid: string) => queryMap[uid]),
    },
    config: {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === "server.url") return "https://api.new.infinitycolor.co";
        return defaultValue;
      }),
    },
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
