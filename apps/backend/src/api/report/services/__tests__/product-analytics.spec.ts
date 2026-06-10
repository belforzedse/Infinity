import {
  periodDelta,
  allocate,
  classifyStock,
  daysOfCover,
  windowDays,
  previousPeriod,
  autoGrouping,
  normalizeGrouping,
  normalizeSort,
  clampPageSize,
  clampPage,
  irrToToman,
  serializeProductRow,
  PERFORMANCE_SORT_COLUMNS,
  MAX_PAGE_SIZE,
} from "../product-analytics";

describe("product-analytics pure helpers", () => {
  describe("periodDelta", () => {
    it("computes absolute and percentage change", () => {
      expect(periodDelta(150, 100)).toEqual({
        current: 150,
        previous: 100,
        change: 50,
        changePct: 50,
      });
    });

    it("returns null percentage when the baseline is zero (zero-period safe)", () => {
      const d = periodDelta(120, 0);
      expect(d.change).toBe(120);
      expect(d.changePct).toBeNull();
    });

    it("handles both-zero", () => {
      expect(periodDelta(0, 0)).toEqual({
        current: 0,
        previous: 0,
        change: 0,
        changePct: null,
      });
    });

    it("supports negative change", () => {
      expect(periodDelta(80, 100).changePct).toBe(-20);
    });
  });

  describe("allocate", () => {
    it("pro-rates by line share of order gross", () => {
      // order gross 1000, line 250 (25%), amount 200 -> 50
      expect(allocate(250, 1000, 200)).toBe(50);
    });

    it("returns 0 when order gross is non-positive (no divide-by-zero)", () => {
      expect(allocate(100, 0, 200)).toBe(0);
    });

    it("returns 0 for a zero-amount or zero-line", () => {
      expect(allocate(0, 1000, 200)).toBe(0);
      expect(allocate(100, 1000, 0)).toBe(0);
    });
  });

  describe("classifyStock", () => {
    it("classifies out / low / in around the threshold", () => {
      expect(classifyStock(0, 5)).toBe("out");
      expect(classifyStock(-3, 5)).toBe("out");
      expect(classifyStock(3, 5)).toBe("low");
      expect(classifyStock(5, 5)).toBe("low");
      expect(classifyStock(6, 5)).toBe("in");
    });
  });

  describe("daysOfCover", () => {
    it("estimates remaining days at current velocity", () => {
      // 30 units over 30 days = 1/day; 10 stock -> 10 days
      expect(daysOfCover(10, 30, 30)).toBe(10);
    });
    it("returns null when nothing sold in window", () => {
      expect(daysOfCover(10, 0, 30)).toBeNull();
    });
  });

  describe("windowDays / previousPeriod", () => {
    it("counts inclusive days and never less than 1", () => {
      const a = new Date("2026-01-01T00:00:00Z");
      const b = new Date("2026-01-08T00:00:00Z");
      expect(windowDays(a, b)).toBe(7);
      expect(windowDays(a, a)).toBe(1);
    });
    it("returns an equal-length preceding window", () => {
      const start = new Date("2026-01-08T00:00:00Z");
      const end = new Date("2026-01-15T00:00:00Z");
      const prev = previousPeriod(start, end);
      expect(prev.end.getTime()).toBe(start.getTime());
      expect(end.getTime() - start.getTime()).toBe(prev.end.getTime() - prev.start.getTime());
    });
  });

  describe("autoGrouping / normalizeGrouping", () => {
    const day = (n: number) => new Date(2026, 0, 1 + n);
    it("picks day/week/month by range length", () => {
      expect(autoGrouping(day(0), day(10))).toBe("day");
      expect(autoGrouping(day(0), day(120))).toBe("week");
      expect(autoGrouping(day(0), day(300))).toBe("month");
    });
    it("respects an explicit valid grouping and falls back to auto otherwise", () => {
      expect(normalizeGrouping("month", day(0), day(10))).toBe("month");
      expect(normalizeGrouping("nonsense", day(0), day(10))).toBe("day");
    });
  });

  describe("normalizeSort", () => {
    it("maps allow-listed keys and direction", () => {
      expect(normalizeSort("units:asc")).toEqual({
        column: PERFORMANCE_SORT_COLUMNS.units,
        direction: "asc",
      });
    });
    it("rejects unknown sort fields, defaulting to gross desc (anti-injection)", () => {
      expect(normalizeSort("__proto__; DROP TABLE orders;--:asc")).toEqual({
        column: PERFORMANCE_SORT_COLUMNS.gross,
        direction: "asc",
      });
      expect(normalizeSort(undefined)).toEqual({
        column: PERFORMANCE_SORT_COLUMNS.gross,
        direction: "desc",
      });
    });
  });

  describe("clampPageSize / clampPage", () => {
    it("clamps page size to the max and defaults invalid input", () => {
      expect(clampPageSize(10)).toBe(10);
      expect(clampPageSize(99999)).toBe(MAX_PAGE_SIZE);
      expect(clampPageSize("abc", 25)).toBe(25);
      expect(clampPageSize(0, 25)).toBe(25);
    });
    it("clamps page to >= 1", () => {
      expect(clampPage(3)).toBe(3);
      expect(clampPage(0)).toBe(1);
      expect(clampPage("abc")).toBe(1);
    });
  });

  describe("irrToToman", () => {
    it("divides IRR by 10", () => {
      expect(irrToToman(2400000)).toBe(240000);
      expect(irrToToman(null)).toBe(0);
    });
  });

  describe("serializeProductRow", () => {
    it("computes net (gross - discount - refund/10), avg price and stock status", () => {
      const row = serializeProductRow(
        {
          product_variation_id: 7,
          product_id: 3,
          product_title: "کفش",
          product_sku: "SKU-1",
          product_type: "Variable",
          category_title: "کفش‌ها",
          units: 4,
          gross: 1_000_000,
          discounts: 50_000,
          refunds_irr: 2_400_000, // -> 240,000 toman
          orders_count: 3,
          current_stock: 2,
          reserved_stock: 1,
        },
        5,
      );
      expect(row.units).toBe(4);
      expect(row.gross).toBe(1_000_000);
      expect(row.discounts).toBe(50_000);
      expect(row.refunds).toBe(240_000);
      expect(row.net).toBe(710_000);
      expect(row.avgPrice).toBe(250_000);
      expect(row.ordersCount).toBe(3);
      expect(row.currentStock).toBe(2);
      expect(row.stockStatus).toBe("low");
    });

    it("marks stock unknown for deleted variations (null stock)", () => {
      const row = serializeProductRow({
        product_variation_id: null,
        product_id: null,
        product_title: "حذف‌شده",
        product_sku: "OLD-SKU",
        product_type: null,
        category_title: null,
        units: 2,
        gross: 100_000,
        discounts: 0,
        refunds_irr: 0,
        orders_count: 1,
        current_stock: null,
        reserved_stock: null,
      });
      expect(row.currentStock).toBeNull();
      expect(row.stockStatus).toBe("unknown");
      expect(row.net).toBe(100_000);
    });

    it("never returns a negative net", () => {
      const row = serializeProductRow({
        product_variation_id: 1,
        product_id: 1,
        product_title: "x",
        product_sku: "x",
        product_type: "Simple",
        category_title: null,
        units: 1,
        gross: 100_000,
        discounts: 0,
        refunds_irr: 2_000_000, // 200,000 toman refund > gross
        orders_count: 1,
        current_stock: 10,
        reserved_stock: 0,
      });
      expect(row.net).toBe(0);
    });
  });
});
