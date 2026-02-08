import { getTrafficDashboard, getTrafficRealtime } from "./traffic";
import { apiClient } from "@/services";

jest.mock("@/services", () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const getMock = apiClient.get as jest.Mock;

describe("traffic report service", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("normalizes dashboard payload shape", async () => {
    getMock.mockResolvedValueOnce({
      data: {
        summary: { visits: "120", visitors: 90, pageviews: 300 },
        realtime: { activeVisitorsLast5Min: "4", activeVisitorsLast30Min: 12, topPagesNow: [] },
        funnel: [
          { step: "view_item", count: 100, conversionFromPrevious: null },
          { step: "add_to_cart", count: 50, conversionFromPrevious: 50 },
        ],
        ecommerce: { orders: 20, totalOrders: 70, revenue: "1500000", conversionRate: "16.66" },
      },
    });

    const payload = await getTrafficDashboard();

    expect(payload.summary.visits).toBe(120);
    expect(payload.realtime.activeVisitorsLast5Min).toBe(4);
    expect(payload.funnel[0].step).toBe("view_item");
    expect(payload.ecommerce.revenue).toBe(1500000);
  });

  it("normalizes realtime payload shape", async () => {
    getMock.mockResolvedValueOnce({
      data: {
        activeVisitorsLast5Min: "3",
        activeVisitorsLast30Min: "11",
        topPagesNow: [{ url: "/pdp/123", visits: "4" }],
        updatedAt: "2026-02-08T00:00:00.000Z",
      },
    });

    const payload = await getTrafficRealtime();

    expect(payload.activeVisitorsLast5Min).toBe(3);
    expect(payload.activeVisitorsLast30Min).toBe(11);
    expect(payload.topPagesNow[0]).toEqual({ url: "/pdp/123", visits: 4 });
  });
});
