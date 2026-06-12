/**
 * Founder access to order-specific event logs.
 *
 * `findOrderActivities` powers the event-logs panel inside the order detail UI.
 * Founders MUST be able to read these (order-scoped), while still being blocked
 * from the global admin-activity report. Uses the REAL roles util so the assertion
 * exercises the actual allowed-role check.
 */

jest.mock("@strapi/strapi", () => ({
  factories: {
    createCoreController: (_uid: string, factory: any) => factory({ strapi: (global as any).strapi }),
  },
}));

function loadController() {
  let controller: any;
  jest.isolateModules(() => {
    controller = require("../admin-activity").default;
  });
  return controller;
}

function createCtx(overrides: Partial<any> = {}) {
  return {
    state: { user: { id: 1 } },
    params: { orderId: 42 },
    query: {},
    send: jest.fn(),
    unauthorized: jest.fn(),
    forbidden: jest.fn(),
    ...overrides,
  };
}

function mockStrapiForRole(roleName: string | null) {
  (global as any).strapi = {
    query: () => ({
      findOne: jest
        .fn()
        .mockResolvedValue(roleName ? { id: 1, role: { name: roleName } } : null),
    }),
    entityService: {
      findMany: jest.fn().mockResolvedValue([{ id: 1, ResourceType: "Order", ResourceId: "42" }]),
      count: jest.fn().mockResolvedValue(1),
    },
  };
}

describe("admin-activity.findOrderActivities - Founder access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns order event logs for a Founder", async () => {
    mockStrapiForRole("Founder");
    const controller = loadController();
    const ctx = createCtx();

    await controller.findOrderActivities(ctx);

    expect(ctx.forbidden).not.toHaveBeenCalled();
    expect(ctx.send).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.any(Array),
        meta: expect.objectContaining({ pagination: expect.any(Object) }),
      }),
    );
  });

  it("returns order event logs for a Superadmin (regression)", async () => {
    mockStrapiForRole("Superadmin");
    const controller = loadController();
    const ctx = createCtx();

    await controller.findOrderActivities(ctx);

    expect(ctx.forbidden).not.toHaveBeenCalled();
    expect(ctx.send).toHaveBeenCalled();
  });

  it("forbids a Store manager from order event logs", async () => {
    mockStrapiForRole("Store manager");
    const controller = loadController();
    const ctx = createCtx();

    await controller.findOrderActivities(ctx);

    expect(ctx.forbidden).toHaveBeenCalled();
    expect(ctx.send).not.toHaveBeenCalled();
  });
});
