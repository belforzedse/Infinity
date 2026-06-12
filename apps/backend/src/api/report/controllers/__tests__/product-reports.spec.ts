export {}; // ensure module scope so test-local mocks don't collide with sibling specs

const fetchUserWithRoleMock = jest.fn();
const roleIsAllowedMock = jest.fn();
const resolveJoinsMock = jest.fn();

jest.mock("../../../../utils/roles", () => ({
  ROLE_NAMES: {
    SUPERADMIN: "Superadmin",
    STORE_MANAGER: "Store manager",
    EDITOR: "Editor",
    FOUNDER: "Founder",
    CUSTOMER: "Customer",
  },
  fetchUserWithRole: (...args: any[]) => fetchUserWithRoleMock(...args),
  roleIsAllowed: (...args: any[]) => roleIsAllowedMock(...args),
}));

jest.mock("../../services/matomo", () => ({
  normalizeRange: jest.fn(),
  getMatomoRealtimePayload: jest.fn(),
  getMatomoTrafficDashboardPayload: jest.fn(),
}));

jest.mock("../../services/product-analytics", () => {
  const actual = jest.requireActual("../../services/product-analytics");
  return { ...actual, resolveJoins: (...args: any[]) => resolveJoinsMock(...args) };
});

const STUB_JOINS = {
  oiToOrder: "JOIN orders o ON true",
  oiToVariation: { join: "", idExpr: "oi.product_variation_id" },
  orderToContract: "JOIN contracts c ON true",
  contractToTx: "JOIN contract_transactions ct ON true",
  variationToProduct: "JOIN products p ON true",
  variationToStock: "LEFT JOIN product_stocks ps ON true",
  productToCategory: { join: "LEFT JOIN product_categories pc ON true", titleExpr: "pc.title" },
};

const PERIOD_ROW = {
  gross: "1000000",
  units: "4",
  orders_count: "3",
  discounts: "50000",
  refund_irr: "2400000", // -> 240,000 Toman
};
const INV_ROW = {
  active_products: "12",
  in_stock: "30",
  low_stock: "4",
  out_stock: "2",
  total_variations: "36",
};
const PERF_ROW = {
  product_variation_id: 7,
  product_id: 3,
  product_title: "کفش",
  product_sku: "SKU-1",
  product_type: "Variable",
  category_title: "کفش‌ها",
  category_id: 2,
  units: "4",
  gross: "1000000",
  discounts: "50000",
  refunds_irr: "2400000",
  orders_count: "3",
  current_stock: "2",
  reserved_stock: "1",
};

function rawRouter(sql: string) {
  if (sql.includes("active_products")) return { rows: [INV_ROW] };
  if (sql.includes("SUM(line_gross) FROM itemized")) return { rows: [PERIOD_ROW] };
  if (sql.includes("FULL OUTER JOIN orders_b")) {
    return {
      rows: [
        {
          bucket: "2026-01-01",
          gross: "500000",
          units: "2",
          orders_count: "1",
          discounts: "0",
          refund_irr: "0",
        },
      ],
    };
  }
  if (sql.includes("COUNT(*)::bigint AS total")) return { rows: [{ total: "1" }] };
  if (sql.includes("agg.product_variation_id")) return { rows: [PERF_ROW] };
  return { rows: [] };
}

function createStrapi() {
  return {
    db: { connection: { raw: jest.fn(async (sql: string) => rawRouter(sql)) } },
    entityService: { findMany: jest.fn().mockResolvedValue([]) },
    log: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
  };
}

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
    notFound: jest.fn(),
    set: jest.fn(),
    ...overrides,
  };
}

describe("product reporting endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resolveJoinsMock.mockResolvedValue(STUB_JOINS);
    (global as any).strapi = createStrapi();
  });

  it("blocks non-manager roles", async () => {
    fetchUserWithRoleMock.mockResolvedValue({ role: { name: "Customer" } });
    roleIsAllowedMock.mockReturnValue(false);

    const controller = loadController();
    const ctx = createCtx();
    await controller.productPerformance(ctx);

    expect(ctx.forbidden).toHaveBeenCalledWith(
      "Access denied - Superadmin, Store manager or Founder role required",
    );
    expect(ctx.body).toBeUndefined();
  });

  it.each([
    ["productOverview", {}],
    ["productTrends", {}],
    ["productPerformance", {}],
    ["productExport", {}],
    ["productDetail", { productId: "3" }],
    ["productInventory", {}],
  ])("allows Founder through the %s access gate", async (handlerName, query) => {
    fetchUserWithRoleMock.mockResolvedValue({ role: { name: "Founder" } });
    roleIsAllowedMock.mockImplementation((role, allowedRoles) => allowedRoles.includes(role));

    const controller = loadController();
    const ctx = createCtx({ query });
    await controller[handlerName](ctx);

    expect(roleIsAllowedMock).toHaveBeenCalledWith("Founder", expect.arrayContaining(["Founder"]));
    expect(ctx.forbidden).not.toHaveBeenCalled();
  });

  describe("with an authorized manager", () => {
    beforeEach(() => {
      fetchUserWithRoleMock.mockResolvedValue({ role: { name: "Store manager" } });
      roleIsAllowedMock.mockReturnValue(true);
    });

    it("overview converts refund IRR->Toman, computes net, and returns inventory", async () => {
      const controller = loadController();
      const ctx = createCtx({ query: { start: "2026-01-01", end: "2026-01-31" } });
      await controller.productOverview(ctx);

      expect(ctx.badRequest).not.toHaveBeenCalled();
      const { kpis, inventory } = ctx.body.data;
      expect(kpis.gross.current).toBe(1_000_000);
      expect(kpis.refunds.current).toBe(240_000); // 2,400,000 IRR / 10
      expect(kpis.net.current).toBe(710_000); // 1,000,000 - 50,000 - 240,000
      // current === previous (same mocked row) -> zero change
      expect(kpis.gross.change).toBe(0);
      expect(inventory.activeProducts).toBe(12);
      expect(inventory.lowStock).toBe(4);
    });

    it("trends returns a tz-bucketed series with net per bucket", async () => {
      const controller = loadController();
      const ctx = createCtx({ query: { start: "2026-01-01", end: "2026-01-07", grouping: "day" } });
      await controller.productTrends(ctx);

      expect(ctx.badRequest).not.toHaveBeenCalled();
      expect(ctx.body.data.grouping).toBe("day");
      expect(ctx.body.data.series).toHaveLength(1);
      expect(ctx.body.data.series[0].net).toBe(500_000);
    });

    it("performance returns server pagination meta and serialized rows", async () => {
      const controller = loadController();
      const ctx = createCtx({
        query: { "pagination[page]": "1", "pagination[pageSize]": "25", sort: "gross:desc" },
      });
      await controller.productPerformance(ctx);

      expect(ctx.badRequest).not.toHaveBeenCalled();
      expect(ctx.body.meta.pagination.total).toBe(1);
      expect(ctx.body.data[0].productSKU).toBe("SKU-1");
      expect(ctx.body.data[0].net).toBe(710_000);
      expect(ctx.body.data[0].stockStatus).toBe("low");
    });

    it("performance clamps an oversized pageSize", async () => {
      const controller = loadController();
      const ctx = createCtx({ query: { pageSize: "99999" } });
      await controller.productPerformance(ctx);
      expect(ctx.body.meta.pagination.pageSize).toBe(100);
    });

    it("export returns CSV with a UTF-8 BOM and Persian header", async () => {
      const controller = loadController();
      const ctx = createCtx({ query: {} });
      await controller.productExport(ctx);

      expect(ctx.set).toHaveBeenCalledWith("Content-Type", "text/csv; charset=utf-8");
      expect(typeof ctx.body).toBe("string");
      expect(ctx.body.startsWith("﻿")).toBe(true);
      expect(ctx.body).toContain("SKU");
      expect(ctx.body).toContain("SKU-1");
    });

    it("detail requires a productId", async () => {
      const controller = loadController();
      const ctx = createCtx({ query: {} });
      await controller.productDetail(ctx);
      expect(ctx.badRequest).toHaveBeenCalledWith("productId is required", {
        data: { success: false },
      });
    });
  });
});
