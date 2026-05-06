const fetchUserWithRoleMock = jest.fn();
const roleIsAllowedMock = jest.fn();
const getMatomoRealtimePayloadMock = jest.fn();
const getMatomoTrafficDashboardPayloadMock = jest.fn();

jest.mock("../../../../utils/roles", () => ({
  ROLE_NAMES: {
    SUPERADMIN: "Superadmin",
    STORE_MANAGER: "Store manager",
    EDITOR: "Editor",
    CUSTOMER: "Customer",
  },
  fetchUserWithRole: (...args: any[]) => fetchUserWithRoleMock(...args),
  roleIsAllowed: (...args: any[]) => roleIsAllowedMock(...args),
}));

jest.mock("../../services/matomo", () => ({
  normalizeRange: jest.fn((start?: string, end?: string) => ({
    startDate: start || "2026-01-01",
    endDate: end || "2026-01-31",
  })),
  getMatomoRealtimePayload: (...args: any[]) => getMatomoRealtimePayloadMock(...args),
  getMatomoTrafficDashboardPayload: (...args: any[]) =>
    getMatomoTrafficDashboardPayloadMock(...args),
}));

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

describe("report traffic endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (global as any).strapi = {
      db: {
        connection: {
          raw: jest.fn(async (query: string) => {
            if (query.includes("total_orders")) {
              return { rows: [{ total_orders: 120, paid_orders: 24 }] };
            }
            if (query.includes("total_irr")) {
              return { rows: [{ total_irr: 2400000 }] };
            }
            return { rows: [] };
          }),
        },
      },
    };
  });

  it("blocks non-superadmin users from realtime endpoint", async () => {
    fetchUserWithRoleMock.mockResolvedValue({ role: { name: "Store manager" } });
    roleIsAllowedMock.mockReturnValue(false);

    const controller = loadController();
    const ctx = createCtx();
    await controller.trafficRealtime(ctx);

    expect(ctx.forbidden).toHaveBeenCalledWith("Access denied - Superadmin role required");
  });

  it("serves realtime data and uses cache for repeated requests", async () => {
    fetchUserWithRoleMock.mockResolvedValue({ role: { name: "Superadmin" } });
    roleIsAllowedMock.mockReturnValue(true);
    getMatomoRealtimePayloadMock.mockResolvedValue({
      activeVisitorsLast5Min: 2,
      activeVisitorsLast30Min: 9,
      topPagesNow: [{ url: "/pdp/item-1", visits: 4 }],
    });

    const controller = loadController();

    const ctxFirst = createCtx();
    await controller.trafficRealtime(ctxFirst);

    const ctxSecond = createCtx();
    await controller.trafficRealtime(ctxSecond);

    expect(getMatomoRealtimePayloadMock).toHaveBeenCalledTimes(1);
    expect(ctxFirst.body.data.activeVisitorsLast5Min).toBe(2);
    expect(ctxFirst.body.data.topPagesNow).toHaveLength(1);
    expect(typeof ctxFirst.body.data.updatedAt).toBe("string");
    expect(ctxSecond.body.data.activeVisitorsLast30Min).toBe(9);
    expect(ctxSecond.badRequest).not.toHaveBeenCalled();
  });

  it("bypasses realtime cache when fresh=1 is requested", async () => {
    fetchUserWithRoleMock.mockResolvedValue({ role: { name: "Superadmin" } });
    roleIsAllowedMock.mockReturnValue(true);
    getMatomoRealtimePayloadMock
      .mockResolvedValueOnce({
        activeVisitorsLast5Min: 2,
        activeVisitorsLast30Min: 9,
        topPagesNow: [{ url: "/pdp/item-1", visits: 4 }],
      })
      .mockResolvedValueOnce({
        activeVisitorsLast5Min: 5,
        activeVisitorsLast30Min: 12,
        topPagesNow: [{ url: "/pdp/item-2", visits: 8 }],
      });

    const controller = loadController();

    const ctxFirst = createCtx();
    await controller.trafficRealtime(ctxFirst);

    const ctxFresh = createCtx({
      query: { fresh: "1" },
    });
    await controller.trafficRealtime(ctxFresh);

    expect(getMatomoRealtimePayloadMock).toHaveBeenCalledTimes(2);
    expect(ctxFresh.body.data.activeVisitorsLast5Min).toBe(5);
  });

  it("returns a stable dashboard contract payload", async () => {
    fetchUserWithRoleMock.mockResolvedValue({ role: { name: "Superadmin" } });
    roleIsAllowedMock.mockReturnValue(true);

    getMatomoTrafficDashboardPayloadMock.mockResolvedValue({
      range: { startDate: "2026-02-01", endDate: "2026-02-07" },
      summary: {
        visits: 100,
        visitors: 80,
        pageviews: 300,
        bounceRate: 20,
        avgActionsPerVisit: 3,
        avgVisitDuration: 120,
      },
      realtime: {
        activeVisitorsLast5Min: 2,
        activeVisitorsLast30Min: 10,
        topPagesNow: [],
      },
      series: [],
      acquisition: { sources: [], campaigns: [] },
      pages: { top: [], landing: [], exit: [] },
      funnel: [],
      deviceBreakdown: [],
      geoBreakdown: [],
    });

    const controller = loadController();
    const ctx = createCtx({
      query: { startDate: "2026-02-01", endDate: "2026-02-07" },
    });
    await controller.trafficDashboard(ctx);

    expect(ctx.badRequest).not.toHaveBeenCalled();
    expect(ctx.body.data.summary.visits).toBe(100);
    expect(ctx.body.data.ecommerce.orders).toBe(24);
    expect(ctx.body.data.ecommerce.totalOrders).toBe(120);
    expect(ctx.body.data.ecommerce.revenue).toBe(240000);
    expect(ctx.body.data.ecommerce.conversionRate).toBe(24);
    expect(typeof ctx.body.data.updatedAt).toBe("string");
  });
});
