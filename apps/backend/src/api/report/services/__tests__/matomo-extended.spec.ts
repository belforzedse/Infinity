import {
  getMatomoTrafficDashboardPayload,
  getProductBehavioral,
  isMatomoConfigured,
  previousRange,
} from "../matomo";

type FetchResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<any>;
};

function ok(payload: any): FetchResponse {
  return { ok: true, status: 200, json: async () => payload };
}
function httpError(status: number): FetchResponse {
  return { ok: false, status, json: async () => ({}) };
}

function installEnv() {
  process.env.MATOMO_BASE_URL = "https://matomo.example.com";
  process.env.MATOMO_SITE_ID = "1";
  process.env.MATOMO_API_TOKEN = "test-token";
  process.env.MATOMO_TIMEOUT_MS = "200";
}

describe("matomo service — comparison, partial data, capabilities", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    installEnv();
  });

  it("isMatomoConfigured reflects env presence", () => {
    expect(isMatomoConfigured()).toBe(true);
    delete process.env.MATOMO_API_TOKEN;
    expect(isMatomoConfigured()).toBe(false);
  });

  it("previousRange returns the immediately-preceding equal-length window", () => {
    expect(previousRange({ startDate: "2026-01-01", endDate: "2026-01-30" })).toEqual({
      startDate: "2025-12-02",
      endDate: "2025-12-31",
    });
    // Single day -> previous day.
    expect(previousRange({ startDate: "2026-03-10", endDate: "2026-03-10" })).toEqual({
      startDate: "2026-03-09",
      endDate: "2026-03-09",
    });
  });

  it("computes previous-period comparison deltas (zero-baseline safe)", async () => {
    jest.spyOn(global, "fetch" as any).mockImplementation(async (url: string) => {
      const u = new URL(url);
      const method = u.searchParams.get("method");
      const date = u.searchParams.get("date") || "";
      if (method === "VisitsSummary.get" && u.searchParams.get("period") === "range") {
        // Current window has data; previous window is empty -> changePct null.
        if (date.startsWith("2026-02-01")) {
          return ok({ nb_visits: 200, nb_uniq_visitors: 150, nb_actions: 600 }) as any;
        }
        return ok({ nb_visits: 0, nb_uniq_visitors: 0, nb_actions: 0 }) as any;
      }
      if (method === "Live.getCounters") return ok([{ visits: 1 }]) as any;
      if (method === "Live.getLastVisitsDetails") return ok([]) as any;
      return ok([]) as any;
    });

    const payload = await getMatomoTrafficDashboardPayload({
      startDate: "2026-02-01",
      endDate: "2026-02-28",
    });

    expect(payload.summary.visits).toBe(200);
    expect(payload.comparison.visits.current).toBe(200);
    expect(payload.comparison.visits.previous).toBe(0);
    expect(payload.comparison.visits.changePct).toBeNull(); // previous = 0
    expect(payload.tracking.partial).toBe(false);
  });

  it("returns partial data when a section fails, without throwing", async () => {
    jest.spyOn(global, "fetch" as any).mockImplementation(async (url: string) => {
      const u = new URL(url);
      const method = u.searchParams.get("method");
      if (method === "Referrers.getSocials") return httpError(500) as any; // one failing section
      if (method === "VisitsSummary.get") return ok({ nb_visits: 10 }) as any;
      if (method === "Live.getCounters") return ok([{ visits: 0 }]) as any;
      if (method === "Live.getLastVisitsDetails") return ok([]) as any;
      return ok([]) as any;
    });

    const payload = await getMatomoTrafficDashboardPayload({
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });

    expect(payload.summary.visits).toBe(10); // other sections still populated
    expect(payload.tracking.partial).toBe(true);
    expect(Object.keys(payload.tracking.sectionErrors)).toContain("socials");
  });

  it("reports capability availability per section", async () => {
    jest.spyOn(global, "fetch" as any).mockImplementation(async (url: string) => {
      const u = new URL(url);
      const method = u.searchParams.get("method");
      if (method === "Actions.getSiteSearchKeywords") return httpError(500) as any;
      if (method === "Live.getCounters") return ok([{ visits: 0 }]) as any;
      if (method === "Live.getLastVisitsDetails") return ok([]) as any;
      return ok([]) as any;
    });

    const payload = await getMatomoTrafficDashboardPayload({
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });
    expect(payload.tracking.capabilities.siteSearch).toBe(false);
    expect(payload.tracking.capabilities.events).toBe(true);
  });
});

describe("getProductBehavioral", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    installEnv();
  });

  it("returns null when Matomo is not configured", async () => {
    delete process.env.MATOMO_BASE_URL;
    const result = await getProductBehavioral("red-shoes", {
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });
    expect(result).toBeNull();
  });

  it("matches the product page by slug and normalizes metrics", async () => {
    jest.spyOn(global, "fetch" as any).mockImplementation(async () =>
      ok([
        { label: "/plp", nb_hits: 9, nb_visits: 7 },
        { label: "/pdp/red-shoes", nb_hits: 42, nb_visits: 30, avg_time_on_page: 75, bounce_rate: "12%" },
      ]) as any,
    );

    const result = await getProductBehavioral("red-shoes", {
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });
    expect(result).toEqual({
      pageviews: 42,
      uniquePageviews: 30,
      avgTimeOnPageSec: 75,
      bounceRate: 12,
    });
  });

  it("returns zeroed metrics when the product page has no views", async () => {
    jest.spyOn(global, "fetch" as any).mockImplementation(async () => ok([{ label: "/plp", nb_hits: 1 }]) as any);
    const result = await getProductBehavioral("never-viewed", {
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });
    expect(result).toEqual({ pageviews: 0, uniquePageviews: 0, avgTimeOnPageSec: 0, bounceRate: 0 });
  });
});
