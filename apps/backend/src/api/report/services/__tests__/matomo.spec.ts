import {
  getMatomoRealtimePayload,
  getMatomoTrafficDashboardPayload,
  normalizeRange,
} from "../matomo";

type FetchResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<any>;
};

function mockJsonResponse(payload: any, status = 200): FetchResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

function installMatomoEnv() {
  process.env.MATOMO_BASE_URL = "https://matomo.example.com";
  process.env.MATOMO_SITE_ID = "1";
  process.env.MATOMO_API_TOKEN = "test-token";
  process.env.MATOMO_TIMEOUT_MS = "100";
}

describe("Matomo report service", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    installMatomoEnv();
  });

  it("normalizes date ranges and rejects invalid date order", () => {
    const range = normalizeRange("2026-01-01", "2026-01-31");
    expect(range).toEqual({ startDate: "2026-01-01", endDate: "2026-01-31" });

    expect(() => normalizeRange("2026-01-31", "2026-01-01")).toThrow("INVALID_DATE_RANGE");
    expect(() => normalizeRange("invalid", "2026-01-01")).toThrow("INVALID_DATE_RANGE");
  });

  it("fails with MATOMO_AUTH_FAILED when token is invalid", async () => {
    jest.spyOn(global, "fetch" as any).mockResolvedValue(
      mockJsonResponse({ result: "error", message: "Invalid token_auth" }) as any,
    );

    await expect(getMatomoRealtimePayload()).rejects.toThrow("MATOMO_AUTH_FAILED");
  });

  it("fails with MATOMO_TIMEOUT on request timeout", async () => {
    process.env.MATOMO_TIMEOUT_MS = "10";
    jest.spyOn(global, "fetch" as any).mockImplementation((_: string, init?: RequestInit) => {
      return new Promise((_, reject) => {
        const signal = init?.signal as AbortSignal | undefined;
        signal?.addEventListener("abort", () => {
          const err = new Error("Request aborted");
          (err as any).name = "AbortError";
          reject(err);
        });
      });
    });

    await expect(getMatomoRealtimePayload()).rejects.toThrow("MATOMO_TIMEOUT");
  });

  it("returns a normalized dashboard payload contract", async () => {
    jest.spyOn(global, "fetch" as any).mockImplementation(async (url: string) => {
      const requestUrl = new URL(url);
      const method = requestUrl.searchParams.get("method");

      switch (method) {
        case "VisitsSummary.get": {
          if (requestUrl.searchParams.get("period") === "day") {
            return mockJsonResponse({
              "2026-01-01": { nb_visits: 12, nb_uniq_visitors: 10, nb_actions: 23 },
              "2026-01-02": { nb_visits: 15, nb_uniq_visitors: 11, nb_actions: 30 },
            }) as any;
          }
          return mockJsonResponse({
            nb_visits: 100,
            nb_uniq_visitors: 70,
            nb_actions: 250,
            bounce_rate: "25%",
            nb_actions_per_visit: 2.5,
            avg_time_on_site: 120,
          }) as any;
        }
        case "Live.getCounters":
          return mockJsonResponse({ visits: requestUrl.searchParams.get("lastMinutes") === "5" ? 3 : 12 }) as any;
        case "Live.getLastVisitsDetails":
          return mockJsonResponse([
            { actionDetails: [{ type: "action", url: "/pdp/item-1" }] },
            { actionDetails: [{ type: "action", url: "/pdp/item-1" }] },
            { actionDetails: [{ type: "action", url: "/plp" }] },
          ]) as any;
        case "Referrers.getWebsites":
          return mockJsonResponse([{ label: "google", nb_visits: 40, nb_uniq_visitors: 25 }]) as any;
        case "Referrers.getCampaigns":
          return mockJsonResponse([{ label: "winter_sale", nb_visits: 12, nb_uniq_visitors: 9 }]) as any;
        case "Actions.getPageUrls":
          return mockJsonResponse([{ label: "/pdp/item-1", nb_hits: 44, nb_visits: 31 }]) as any;
        case "Actions.getEntryPageUrls":
          return mockJsonResponse([{ label: "/pdp/item-1", entry_nb_visits: 11, bounce_rate: "20%" }]) as any;
        case "Actions.getExitPageUrls":
          return mockJsonResponse([{ label: "/checkout", exit_nb_visits: 4, exit_rate: "13.3%" }]) as any;
        case "Events.getAction":
          return mockJsonResponse([
            { label: "view_item", nb_events: 120 },
            { label: "add_to_cart", nb_events: 50 },
            { label: "begin_checkout", nb_events: 20 },
            { label: "purchase", nb_events: 10 },
          ]) as any;
        case "DevicesDetection.getType":
          return mockJsonResponse([{ label: "Desktop", nb_visits: 55 }]) as any;
        case "UserCountry.getCountry":
          return mockJsonResponse([{ label: "Iran", nb_visits: 80 }]) as any;
        default:
          return mockJsonResponse({}) as any;
      }
    });

    const payload = await getMatomoTrafficDashboardPayload({
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });

    expect(payload.summary.visits).toBe(100);
    expect(payload.realtime.activeVisitorsLast5Min).toBe(3);
    expect(payload.series).toHaveLength(2);
    expect(payload.acquisition.sources[0].source).toBe("google");
    expect(payload.pages.top[0].url).toBe("/pdp/item-1");
    expect(payload.funnel.map((row) => row.step)).toEqual([
      "view_item",
      "add_to_cart",
      "begin_checkout",
      "purchase",
    ]);
    expect(payload.deviceBreakdown[0].device).toBe("Desktop");
    expect(payload.geoBreakdown[0].country).toBe("Iran");
  });

  it("uses latest page action per visit for realtime top pages", async () => {
    jest.spyOn(global, "fetch" as any).mockImplementation(async (url: string) => {
      const requestUrl = new URL(url);
      const method = requestUrl.searchParams.get("method");

      switch (method) {
        case "Live.getCounters":
          return mockJsonResponse({ visits: 1 }) as any;
        case "Live.getLastVisitsDetails":
          return mockJsonResponse([
            {
              actionDetails: [
                { type: "action", url: "/plp" },
                { type: "action", url: "/pdp/1" },
              ],
            },
            {
              actionDetails: [
                { type: "action", url: "/pdp/1" },
                { type: "action", url: "/checkout" },
              ],
            },
          ]) as any;
        default:
          return mockJsonResponse({}) as any;
      }
    });

    const payload = await getMatomoRealtimePayload();
    expect(payload.topPagesNow[0]).toEqual({ url: "/pdp/1", visits: 1 });
    expect(payload.topPagesNow[1]).toEqual({ url: "/checkout", visits: 1 });
  });
});
