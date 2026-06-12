/**
 * Founder role access tests for the report controller.
 *
 * Uses the REAL roles util (ROLE_NAMES / roleIsAllowed) so the assertions exercise the
 * actual allowed-role arrays wired into each handler. The matomo/product-analytics services
 * are mocked to avoid heavy imports/side effects.
 *
 * Contract:
 *  - Founder MAY call productSales (sales report under «گزارشات فروش»).
 *  - Founder MUST NOT call trafficDashboard or adminActivity (Superadmin-only).
 */

jest.mock("../../services/matomo", () => ({
  normalizeRange: jest.fn(() => ({ startDate: "2026-01-01", endDate: "2026-01-31" })),
  getMatomoRealtimePayload: jest.fn(),
  getMatomoTrafficDashboardPayload: jest.fn(),
  getProductBehavioral: jest.fn(),
}));

jest.mock("../../services/product-analytics", () => ({}));

function loadController() {
  let controller: any;
  jest.isolateModules(() => {
    controller = require("../report").default;
  });
  return controller;
}

function createCtx(overrides: Partial<any> = {}) {
  return {
    state: { user: { id: 1 } },
    query: {},
    body: undefined,
    forbidden: jest.fn(),
    badRequest: jest.fn(),
    ...overrides,
  };
}

/** Wire a global strapi whose user lookup returns a user with the given role name. */
function mockStrapiForRole(roleName: string) {
  (global as any).strapi = {
    query: () => ({
      findOne: jest.fn().mockResolvedValue({ id: 1, role: { name: roleName } }),
    }),
    db: {
      connection: {
        raw: jest.fn().mockResolvedValue({ rows: [] }),
      },
    },
  };
}

describe("report controller - Founder access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows Founder to call productSales (does not forbid)", async () => {
    mockStrapiForRole("Founder");
    const controller = loadController();
    const ctx = createCtx();

    await controller.productSales(ctx);

    expect(ctx.forbidden).not.toHaveBeenCalled();
  });

  it("blocks Founder from the traffic dashboard", async () => {
    mockStrapiForRole("Founder");
    const controller = loadController();
    const ctx = createCtx();

    await controller.trafficDashboard(ctx);

    expect(ctx.forbidden).toHaveBeenCalledWith(
      expect.stringContaining("Superadmin"),
    );
  });

  it("blocks Founder from the global admin-activity report", async () => {
    mockStrapiForRole("Founder");
    const controller = loadController();
    const ctx = createCtx();

    await controller.adminActivity(ctx);

    expect(ctx.forbidden).toHaveBeenCalled();
  });

  it("blocks a Customer from productSales", async () => {
    mockStrapiForRole("Customer");
    const controller = loadController();
    const ctx = createCtx();

    await controller.productSales(ctx);

    expect(ctx.forbidden).toHaveBeenCalled();
  });
});
