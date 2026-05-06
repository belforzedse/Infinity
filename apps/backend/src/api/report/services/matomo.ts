import { parsePositiveInt } from "../../../utils/parsePositiveInt";

type MatomoRow = Record<string, any>;

export type TrafficRange = {
  startDate: string;
  endDate: string;
};

export type TrafficDashboardPayload = {
  range: TrafficRange;
  summary: {
    visits: number;
    visitors: number;
    pageviews: number;
    bounceRate: number;
    avgActionsPerVisit: number;
    avgVisitDuration: number;
  };
  realtime: {
    activeVisitorsLast5Min: number;
    activeVisitorsLast30Min: number;
    topPagesNow: Array<{ url: string; visits: number }>;
  };
  series: Array<{
    date: string;
    visits: number;
    visitors: number;
    pageviews: number;
  }>;
  acquisition: {
    sources: Array<{ source: string; visits: number; visitors: number }>;
    campaigns: Array<{ campaign: string; visits: number; visitors: number }>;
  };
  pages: {
    top: Array<{ url: string; pageviews: number; uniquePageviews: number }>;
    landing: Array<{ url: string; entries: number; bounceRate: number }>;
    exit: Array<{ url: string; exits: number; exitRate: number }>;
  };
  funnel: Array<{
    step: "view_item" | "add_to_cart" | "begin_checkout" | "purchase";
    count: number;
    conversionFromPrevious: number | null;
  }>;
  deviceBreakdown: Array<{ device: string; visits: number }>;
  geoBreakdown: Array<{ country: string; visits: number }>;
};

const DEFAULT_TIMEOUT_MS = 8000;
const STEP_ORDER = ["view_item", "add_to_cart", "begin_checkout", "purchase"] as const;

function toYyyyMmDd(value: Date): string {
  return value.toISOString().split("T")[0];
}

export function normalizeRange(start?: string, end?: string): TrafficRange {
  const now = new Date();
  const defaultEnd = new Date(now);
  const defaultStart = new Date(now);
  defaultStart.setDate(defaultStart.getDate() - 29);

  const parsedStart = start ? new Date(start) : defaultStart;
  const parsedEnd = end ? new Date(end) : defaultEnd;

  if (!Number.isFinite(parsedStart.getTime()) || !Number.isFinite(parsedEnd.getTime())) {
    throw new Error("INVALID_DATE_RANGE");
  }
  if (parsedEnd.getTime() < parsedStart.getTime()) {
    throw new Error("INVALID_DATE_RANGE");
  }

  return {
    startDate: toYyyyMmDd(parsedStart),
    endDate: toYyyyMmDd(parsedEnd),
  };
}

function normalizeRows(input: unknown): MatomoRow[] {
  if (Array.isArray(input)) return input;
  if (!input || typeof input !== "object") return [];
  return Object.values(input as Record<string, MatomoRow>);
}

function normalizeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePercent(value: unknown): number {
  if (typeof value === "string") {
    const cleaned = value.replace("%", "").trim();
    return normalizeNumber(cleaned);
  }
  return normalizeNumber(value);
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function getMatomoConfig() {
  const baseUrl = process.env.MATOMO_BASE_URL;
  const siteId = process.env.MATOMO_SITE_ID;
  const apiToken = process.env.MATOMO_API_TOKEN;
  const timeoutMs = parsePositiveInt(process.env.MATOMO_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);

  if (!baseUrl || !siteId || !apiToken) {
    throw new Error("MATOMO_CONFIG_MISSING");
  }

  return { baseUrl, siteId, apiToken, timeoutMs };
}

async function fetchMatomo(
  method: string,
  params: Record<string, string | number | undefined>,
): Promise<any> {
  const { baseUrl, siteId, apiToken, timeoutMs } = getMatomoConfig();
  const endpoint = new URL("index.php", ensureTrailingSlash(baseUrl));
  endpoint.searchParams.set("module", "API");
  endpoint.searchParams.set("method", method);
  endpoint.searchParams.set("idSite", String(siteId));
  endpoint.searchParams.set("format", "JSON");
  endpoint.searchParams.set("token_auth", apiToken);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    endpoint.searchParams.set(key, String(value));
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint.toString(), { signal: controller.signal });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("MATOMO_AUTH_FAILED");
      }
      throw new Error(`MATOMO_HTTP_${response.status}`);
    }

    const payload: any = await response.json();
    if (payload && typeof payload === "object" && payload.result === "error") {
      const message = String(payload.message || "MATOMO_API_ERROR");
      if (message.toLowerCase().includes("token")) {
        throw new Error("MATOMO_AUTH_FAILED");
      }
      throw new Error(`MATOMO_API_ERROR: ${message}`);
    }
    return payload;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("MATOMO_TIMEOUT");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function toSeriesRows(input: unknown): TrafficDashboardPayload["series"] {
  if (!input || typeof input !== "object" || Array.isArray(input)) return [];
  return Object.entries(input as Record<string, any>).map(([date, item]) => ({
    date,
    visits: normalizeNumber(item?.nb_visits),
    visitors: normalizeNumber(item?.nb_uniq_visitors),
    pageviews: normalizeNumber(item?.nb_actions),
  }));
}

function parseFunnelRows(input: unknown): TrafficDashboardPayload["funnel"] {
  const actions = normalizeRows(input);
  const totals = STEP_ORDER.reduce<Record<string, number>>((acc, step) => {
    acc[step] = 0;
    return acc;
  }, {});

  actions.forEach((row) => {
    const rawLabel = String(row?.label || "").toLowerCase();
    if (!rawLabel) return;
    const matchedStep = STEP_ORDER.find((step) => rawLabel === step);
    if (!matchedStep) return;
    totals[matchedStep] += normalizeNumber(row?.nb_events);
  });

  let previous = 0;
  return STEP_ORDER.map((step, index) => {
    const current = totals[step];
    const conversionFromPrevious =
      index === 0 ? null : previous > 0 ? Number(((current / previous) * 100).toFixed(2)) : 0;
    previous = current;
    return {
      step,
      count: current,
      conversionFromPrevious,
    };
  });
}

function parseTopCurrentPages(lastVisits: unknown): Array<{ url: string; visits: number }> {
  const visits = normalizeRows(lastVisits);
  const counters = new Map<string, number>();

  visits.forEach((visit) => {
    const actions = Array.isArray(visit?.actionDetails) ? visit.actionDetails : [];
    // Use the latest page action in each visit to better represent "active pages now".
    const pageActions = actions.filter((action: any) => action?.type === "action");
    const latestPageAction = pageActions.length ? pageActions[pageActions.length - 1] : null;
    const url = String(latestPageAction?.url || latestPageAction?.pageUrl || "").trim();
    if (!url) return;
    counters.set(url, (counters.get(url) || 0) + 1);
  });

  return Array.from(counters.entries())
    .map(([url, visitsCount]) => ({ url, visits: visitsCount }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);
}

export async function getMatomoRealtimePayload(): Promise<TrafficDashboardPayload["realtime"]> {
  const [last5, last30, lastVisits] = await Promise.all([
    fetchMatomo("Live.getCounters", { lastMinutes: 5 }),
    fetchMatomo("Live.getCounters", { lastMinutes: 30 }),
    fetchMatomo("Live.getLastVisitsDetails", {
      period: "day",
      date: "today",
      filter_limit: 100,
      flat: 1,
    }),
  ]);

  return {
    activeVisitorsLast5Min: normalizeNumber(last5?.visits),
    activeVisitorsLast30Min: normalizeNumber(last30?.visits),
    topPagesNow: parseTopCurrentPages(lastVisits),
  };
}

export async function getMatomoTrafficDashboardPayload(
  range: TrafficRange,
): Promise<TrafficDashboardPayload> {
  const dateRange = `${range.startDate},${range.endDate}`;

  const [
    summary,
    series,
    sources,
    campaigns,
    topPages,
    landingPages,
    exitPages,
    eventsByAction,
    deviceBreakdown,
    geoBreakdown,
    realtime,
  ] = await Promise.all([
    fetchMatomo("VisitsSummary.get", { period: "range", date: dateRange }),
    fetchMatomo("VisitsSummary.get", { period: "day", date: dateRange }),
    fetchMatomo("Referrers.getWebsites", { period: "range", date: dateRange, flat: 1 }),
    fetchMatomo("Referrers.getCampaigns", { period: "range", date: dateRange, flat: 1 }),
    fetchMatomo("Actions.getPageUrls", { period: "range", date: dateRange, flat: 1, expanded: 1 }),
    fetchMatomo("Actions.getEntryPageUrls", {
      period: "range",
      date: dateRange,
      flat: 1,
      expanded: 1,
    }),
    fetchMatomo("Actions.getExitPageUrls", {
      period: "range",
      date: dateRange,
      flat: 1,
      expanded: 1,
    }),
    fetchMatomo("Events.getAction", { period: "range", date: dateRange, flat: 1 }),
    fetchMatomo("DevicesDetection.getType", { period: "range", date: dateRange, flat: 1 }),
    fetchMatomo("UserCountry.getCountry", { period: "range", date: dateRange, flat: 1 }),
    getMatomoRealtimePayload(),
  ]);

  return {
    range,
    summary: {
      visits: normalizeNumber(summary?.nb_visits),
      visitors: normalizeNumber(summary?.nb_uniq_visitors),
      pageviews: normalizeNumber(summary?.nb_actions),
      bounceRate: normalizePercent(summary?.bounce_rate),
      avgActionsPerVisit: normalizeNumber(summary?.nb_actions_per_visit),
      avgVisitDuration: normalizeNumber(summary?.avg_time_on_site),
    },
    realtime,
    series: toSeriesRows(series),
    acquisition: {
      sources: normalizeRows(sources)
        .map((row) => ({
          source: String(row?.label || "Unknown"),
          visits: normalizeNumber(row?.nb_visits),
          visitors: normalizeNumber(row?.nb_uniq_visitors),
        }))
        .slice(0, 10),
      campaigns: normalizeRows(campaigns)
        .map((row) => ({
          campaign: String(row?.label || "Unknown"),
          visits: normalizeNumber(row?.nb_visits),
          visitors: normalizeNumber(row?.nb_uniq_visitors),
        }))
        .slice(0, 10),
    },
    pages: {
      top: normalizeRows(topPages)
        .map((row) => ({
          url: String(row?.label || ""),
          pageviews: normalizeNumber(row?.nb_hits),
          uniquePageviews: normalizeNumber(row?.nb_visits),
        }))
        .filter((row) => row.url)
        .slice(0, 10),
      landing: normalizeRows(landingPages)
        .map((row) => ({
          url: String(row?.label || ""),
          entries: normalizeNumber(row?.entry_nb_visits || row?.nb_visits),
          bounceRate: normalizePercent(row?.bounce_rate),
        }))
        .filter((row) => row.url)
        .slice(0, 10),
      exit: normalizeRows(exitPages)
        .map((row) => ({
          url: String(row?.label || ""),
          exits: normalizeNumber(row?.exit_nb_visits || row?.nb_visits),
          exitRate: normalizePercent(row?.exit_rate),
        }))
        .filter((row) => row.url)
        .slice(0, 10),
    },
    funnel: parseFunnelRows(eventsByAction),
    deviceBreakdown: normalizeRows(deviceBreakdown)
      .map((row) => ({
        device: String(row?.label || "Unknown"),
        visits: normalizeNumber(row?.nb_visits),
      }))
      .slice(0, 10),
    geoBreakdown: normalizeRows(geoBreakdown)
      .map((row) => ({
        country: String(row?.label || "Unknown"),
        visits: normalizeNumber(row?.nb_visits),
      }))
      .slice(0, 10),
  };
}
