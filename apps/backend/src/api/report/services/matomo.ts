import { parsePositiveInt } from "../../../utils/parsePositiveInt";
import { REPORT_TIMEZONE, periodDelta, type Delta } from "./product-analytics";

type MatomoRow = Record<string, any>;

export type TrafficRange = {
  startDate: string;
  endDate: string;
};

type LabeledVisits = { label: string; visits: number; visitors: number };

export type TrafficDashboardPayload = {
  range: TrafficRange;
  comparisonRange: TrafficRange;
  summary: {
    visits: number;
    visitors: number;
    pageviews: number;
    bounceRate: number;
    avgActionsPerVisit: number;
    avgVisitDuration: number;
  };
  /** Previous equal-length period deltas. `changePct` is null when the baseline is 0. */
  comparison: {
    visits: Delta;
    visitors: Delta;
    pageviews: Delta;
    bounceRate: Delta;
    avgVisitDuration: Delta;
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
    channelTypes: LabeledVisits[];
    sources: Array<{ source: string; visits: number; visitors: number }>;
    searchEngines: LabeledVisits[];
    socials: LabeledVisits[];
    campaigns: Array<{ campaign: string; visits: number; visitors: number }>;
  };
  pages: {
    top: Array<{ url: string; pageviews: number; uniquePageviews: number }>;
    landing: Array<{ url: string; entries: number; bounceRate: number }>;
    exit: Array<{ url: string; exits: number; exitRate: number }>;
  };
  siteSearch: {
    keywords: Array<{ keyword: string; searches: number; resultsPageviews: number }>;
    noResults: Array<{ keyword: string; searches: number }>;
  };
  audience: {
    devices: Array<{ device: string; visits: number }>;
    browsers: LabeledVisits[];
    operatingSystems: LabeledVisits[];
    languages: LabeledVisits[];
    countries: Array<{ country: string; visits: number }>;
    newVsReturning: { newVisits: number; returningVisits: number };
  };
  funnel: Array<{
    step: "view_item" | "add_to_cart" | "begin_checkout" | "purchase";
    count: number;
    conversionFromPrevious: number | null;
  }>;
  /** @deprecated kept for backward compatibility — mirrors `audience.devices`. */
  deviceBreakdown: Array<{ device: string; visits: number }>;
  /** @deprecated kept for backward compatibility — mirrors `audience.countries`. */
  geoBreakdown: Array<{ country: string; visits: number }>;
  tracking: {
    configured: boolean;
    version: string | null;
    /** Whether one or more sections failed to load (the rest are still returned). */
    partial: boolean;
    /** section key -> short error code, for the tracking-health panel. */
    sectionErrors: Record<string, string>;
    /** Which optional report areas responded successfully this run. */
    capabilities: {
      siteSearch: boolean;
      events: boolean;
      visitFrequency: boolean;
    };
  };
};

const DEFAULT_TIMEOUT_MS = 8000;
const STEP_ORDER = ["view_item", "add_to_cart", "begin_checkout", "purchase"] as const;
const TABLE_LIMIT = 10;
const SUSPICIOUS_CAMPAIGN_LABEL = "Suspicious campaign blocked";

const DAY_MS = 86_400_000;

/**
 * Format a Date as YYYY-MM-DD in the business timezone (Asia/Tehran by default)
 * so report day boundaries match how the store actually experiences a "day".
 * `en-CA` formats as YYYY-MM-DD.
 */
function toYyyyMmDd(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

/** Parse a YYYY-MM-DD string into a UTC midnight Date for stable date-only math. */
function parseYmdUtc(value: string): Date {
  const [y, m, d] = value.split("-").map((part) => Number(part));
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
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

/**
 * The immediately-preceding window of the same length, used for period-over-period
 * comparison. For a 30-day range ending today, this is the prior 30 days.
 */
export function previousRange(range: TrafficRange): TrafficRange {
  const startUtc = parseYmdUtc(range.startDate);
  const endUtc = parseYmdUtc(range.endDate);
  const lengthDays = Math.round((endUtc.getTime() - startUtc.getTime()) / DAY_MS) + 1;
  const prevEnd = new Date(startUtc.getTime() - DAY_MS);
  const prevStart = new Date(prevEnd.getTime() - (lengthDays - 1) * DAY_MS);
  return {
    startDate: toYyyyMmDd(prevStart),
    endDate: toYyyyMmDd(prevEnd),
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

function normalizeLabel(value: unknown, fallback = "Unknown"): string {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function isSuspiciousCampaignLabel(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;

  return (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("data:") ||
    normalized.includes("domxss") ||
    normalized.includes("<script") ||
    normalized.includes("</script") ||
    normalized.includes("onerror=") ||
    normalized.includes("onload=") ||
    normalized.includes("{{") ||
    normalized.includes("{%") ||
    normalized.includes("<%") ||
    normalized.includes("${")
  );
}

function toCampaignRows(input: unknown): TrafficDashboardPayload["acquisition"]["campaigns"] {
  const counters = new Map<string, { campaign: string; visits: number; visitors: number }>();

  normalizeRows(input).forEach((row) => {
    const rawLabel = normalizeLabel(row?.label);
    const campaign = isSuspiciousCampaignLabel(rawLabel) ? SUSPICIOUS_CAMPAIGN_LABEL : rawLabel;
    const current = counters.get(campaign) || { campaign, visits: 0, visitors: 0 };
    current.visits += normalizeNumber(row?.nb_visits);
    current.visitors += normalizeNumber(row?.nb_uniq_visitors);
    counters.set(campaign, current);
  });

  return Array.from(counters.values())
    .sort((a, b) => b.visits - a.visits)
    .slice(0, TABLE_LIMIT);
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

export function isMatomoConfigured(): boolean {
  return Boolean(
    process.env.MATOMO_BASE_URL && process.env.MATOMO_SITE_ID && process.env.MATOMO_API_TOKEN,
  );
}

/**
 * Low-level Matomo Reporting API call. The `method` is always supplied by this
 * module (never by the client), so the set of callable methods is an implicit
 * allowlist — there is no arbitrary-method proxying and no way to override the
 * Matomo base URL from a request, which prevents SSRF.
 */
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

/**
 * Run a set of named Matomo calls concurrently, tolerating individual failures.
 * Returns the resolved values keyed by name (missing on failure) plus a map of
 * section -> short error code so the dashboard can render partial data and a
 * tracking-health summary instead of failing the whole request.
 */
async function fetchSettled(
  tasks: Record<string, Promise<any>>,
): Promise<{ values: Record<string, any>; errors: Record<string, string> }> {
  const keys = Object.keys(tasks);
  const results = await Promise.allSettled(keys.map((key) => tasks[key]));
  const values: Record<string, any> = {};
  const errors: Record<string, string> = {};
  results.forEach((result, index) => {
    const key = keys[index];
    if (result.status === "fulfilled") {
      values[key] = result.value;
    } else {
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      errors[key] = message.slice(0, 80);
    }
  });
  return { values, errors };
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

function toLabeledVisits(input: unknown): LabeledVisits[] {
  return normalizeRows(input)
    .map((row) => ({
      label: normalizeLabel(row?.label),
      visits: normalizeNumber(row?.nb_visits),
      visitors: normalizeNumber(row?.nb_uniq_visitors),
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, TABLE_LIMIT);
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
    .slice(0, TABLE_LIMIT);
}

function emptySummary() {
  return { nb_visits: 0, nb_uniq_visitors: 0, nb_actions: 0, bounce_rate: 0, nb_actions_per_visit: 0, avg_time_on_site: 0 };
}

export type ProductBehavioral = {
  pageviews: number;
  uniquePageviews: number;
  avgTimeOnPageSec: number;
  bounceRate: number;
};

/**
 * Reusable behavioral lookup for a single product page (`/pdp/{slug}`), so other
 * reports (e.g. the product report) can show Matomo engagement alongside the
 * authoritative Strapi sales data. Fully graceful: returns `null` when Matomo is
 * not configured or any error occurs, so it can never break the host report.
 * Zero counts (product page never viewed) are returned as a real result.
 */
export async function getProductBehavioral(
  slug: string,
  range: TrafficRange,
): Promise<ProductBehavioral | null> {
  if (!slug || !isMatomoConfigured()) return null;
  try {
    const dateRange = `${range.startDate},${range.endDate}`;
    const rows = normalizeRows(
      await fetchMatomo("Actions.getPageUrls", {
        period: "range",
        date: dateRange,
        flat: 1,
        expanded: 1,
        filter_limit: 500,
      }),
    );
    const needle = `/pdp/${slug}`.toLowerCase();
    const match = rows.find((row) =>
      String(row?.label || row?.url || "")
        .toLowerCase()
        .includes(needle),
    );
    if (!match) {
      return { pageviews: 0, uniquePageviews: 0, avgTimeOnPageSec: 0, bounceRate: 0 };
    }
    return {
      pageviews: normalizeNumber(match.nb_hits),
      uniquePageviews: normalizeNumber(match.nb_visits),
      avgTimeOnPageSec: normalizeNumber(match.avg_time_on_page),
      bounceRate: normalizePercent(match.bounce_rate),
    };
  } catch {
    return null;
  }
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

  // Live.getCounters returns an array with a single object.
  const counter = (value: any) => (Array.isArray(value) ? value[0] : value);

  return {
    activeVisitorsLast5Min: normalizeNumber(counter(last5)?.visits),
    activeVisitorsLast30Min: normalizeNumber(counter(last30)?.visits),
    topPagesNow: parseTopCurrentPages(lastVisits),
  };
}

export async function getMatomoTrafficDashboardPayload(
  range: TrafficRange,
): Promise<TrafficDashboardPayload> {
  const dateRange = `${range.startDate},${range.endDate}`;
  const comparisonRange = previousRange(range);
  const prevDateRange = `${comparisonRange.startDate},${comparisonRange.endDate}`;

  const { values, errors } = await fetchSettled({
    summary: fetchMatomo("VisitsSummary.get", { period: "range", date: dateRange }),
    summaryPrev: fetchMatomo("VisitsSummary.get", { period: "range", date: prevDateRange }),
    series: fetchMatomo("VisitsSummary.get", { period: "day", date: dateRange }),
    channelTypes: fetchMatomo("Referrers.getReferrerType", { period: "range", date: dateRange }),
    sources: fetchMatomo("Referrers.getWebsites", { period: "range", date: dateRange, flat: 1 }),
    searchEngines: fetchMatomo("Referrers.getSearchEngines", { period: "range", date: dateRange }),
    socials: fetchMatomo("Referrers.getSocials", { period: "range", date: dateRange }),
    campaigns: fetchMatomo("Referrers.getCampaigns", { period: "range", date: dateRange, flat: 1 }),
    topPages: fetchMatomo("Actions.getPageUrls", { period: "range", date: dateRange, flat: 1, expanded: 1 }),
    landingPages: fetchMatomo("Actions.getEntryPageUrls", { period: "range", date: dateRange, flat: 1, expanded: 1 }),
    exitPages: fetchMatomo("Actions.getExitPageUrls", { period: "range", date: dateRange, flat: 1, expanded: 1 }),
    searchKeywords: fetchMatomo("Actions.getSiteSearchKeywords", { period: "range", date: dateRange }),
    searchNoResults: fetchMatomo("Actions.getSiteSearchNoResultKeywords", { period: "range", date: dateRange }),
    events: fetchMatomo("Events.getAction", { period: "range", date: dateRange, flat: 1 }),
    devices: fetchMatomo("DevicesDetection.getType", { period: "range", date: dateRange, flat: 1 }),
    browsers: fetchMatomo("DevicesDetection.getBrowsers", { period: "range", date: dateRange, flat: 1 }),
    operatingSystems: fetchMatomo("DevicesDetection.getOsFamilies", { period: "range", date: dateRange, flat: 1 }),
    languages: fetchMatomo("UserLanguage.getLanguage", { period: "range", date: dateRange, flat: 1 }),
    countries: fetchMatomo("UserCountry.getCountry", { period: "range", date: dateRange, flat: 1 }),
    visitFrequency: fetchMatomo("VisitFrequency.get", { period: "range", date: dateRange }),
    version: fetchMatomo("API.getMatomoVersion", {}),
    realtime: getMatomoRealtimePayload(),
  });

  const summary = values.summary || emptySummary();
  const summaryPrev = values.summaryPrev || emptySummary();
  const visitFrequency = values.visitFrequency || {};

  const versionRaw = values.version;
  const version =
    typeof versionRaw === "string"
      ? versionRaw
      : versionRaw && typeof versionRaw === "object"
        ? String(versionRaw.value ?? versionRaw.version ?? "")
        : null;

  const sectionErrors = errors;
  const partial = Object.keys(sectionErrors).length > 0;

  return {
    range,
    comparisonRange,
    summary: {
      visits: normalizeNumber(summary?.nb_visits),
      visitors: normalizeNumber(summary?.nb_uniq_visitors),
      pageviews: normalizeNumber(summary?.nb_actions),
      bounceRate: normalizePercent(summary?.bounce_rate),
      avgActionsPerVisit: normalizeNumber(summary?.nb_actions_per_visit),
      avgVisitDuration: normalizeNumber(summary?.avg_time_on_site),
    },
    comparison: {
      visits: periodDelta(normalizeNumber(summary?.nb_visits), normalizeNumber(summaryPrev?.nb_visits)),
      visitors: periodDelta(
        normalizeNumber(summary?.nb_uniq_visitors),
        normalizeNumber(summaryPrev?.nb_uniq_visitors),
      ),
      pageviews: periodDelta(normalizeNumber(summary?.nb_actions), normalizeNumber(summaryPrev?.nb_actions)),
      bounceRate: periodDelta(
        normalizePercent(summary?.bounce_rate),
        normalizePercent(summaryPrev?.bounce_rate),
      ),
      avgVisitDuration: periodDelta(
        normalizeNumber(summary?.avg_time_on_site),
        normalizeNumber(summaryPrev?.avg_time_on_site),
      ),
    },
    realtime: values.realtime || { activeVisitorsLast5Min: 0, activeVisitorsLast30Min: 0, topPagesNow: [] },
    series: toSeriesRows(values.series),
    acquisition: {
      channelTypes: toLabeledVisits(values.channelTypes),
      sources: normalizeRows(values.sources)
        .map((row) => ({
          source: normalizeLabel(row?.label),
          visits: normalizeNumber(row?.nb_visits),
          visitors: normalizeNumber(row?.nb_uniq_visitors),
        }))
        .slice(0, TABLE_LIMIT),
      searchEngines: toLabeledVisits(values.searchEngines),
      socials: toLabeledVisits(values.socials),
      campaigns: toCampaignRows(values.campaigns),
    },
    pages: {
      top: normalizeRows(values.topPages)
        .map((row) => ({
          url: String(row?.label || ""),
          pageviews: normalizeNumber(row?.nb_hits),
          uniquePageviews: normalizeNumber(row?.nb_visits),
        }))
        .filter((row) => row.url)
        .slice(0, TABLE_LIMIT),
      landing: normalizeRows(values.landingPages)
        .map((row) => ({
          url: String(row?.label || ""),
          entries: normalizeNumber(row?.entry_nb_visits || row?.nb_visits),
          bounceRate: normalizePercent(row?.bounce_rate),
        }))
        .filter((row) => row.url)
        .slice(0, TABLE_LIMIT),
      exit: normalizeRows(values.exitPages)
        .map((row) => ({
          url: String(row?.label || ""),
          exits: normalizeNumber(row?.exit_nb_visits || row?.nb_visits),
          exitRate: normalizePercent(row?.exit_rate),
        }))
        .filter((row) => row.url)
        .slice(0, TABLE_LIMIT),
    },
    siteSearch: {
      keywords: normalizeRows(values.searchKeywords)
        .map((row) => ({
          keyword: String(row?.label || ""),
          searches: normalizeNumber(row?.nb_visits || row?.nb_actions),
          resultsPageviews: normalizeNumber(row?.nb_pages_per_search ?? row?.exit_rate ?? 0),
        }))
        .filter((row) => row.keyword)
        .slice(0, TABLE_LIMIT),
      noResults: normalizeRows(values.searchNoResults)
        .map((row) => ({
          keyword: String(row?.label || ""),
          searches: normalizeNumber(row?.nb_visits || row?.nb_actions),
        }))
        .filter((row) => row.keyword)
        .slice(0, TABLE_LIMIT),
    },
    audience: {
      devices: normalizeRows(values.devices)
        .map((row) => ({ device: normalizeLabel(row?.label), visits: normalizeNumber(row?.nb_visits) }))
        .slice(0, TABLE_LIMIT),
      browsers: toLabeledVisits(values.browsers),
      operatingSystems: toLabeledVisits(values.operatingSystems),
      languages: toLabeledVisits(values.languages),
      countries: normalizeRows(values.countries)
        .map((row) => ({ country: normalizeLabel(row?.label), visits: normalizeNumber(row?.nb_visits) }))
        .slice(0, TABLE_LIMIT),
      newVsReturning: {
        newVisits: normalizeNumber(visitFrequency?.nb_visits_new),
        returningVisits: normalizeNumber(visitFrequency?.nb_visits_returning),
      },
    },
    funnel: parseFunnelRows(values.events),
    deviceBreakdown: normalizeRows(values.devices)
      .map((row) => ({ device: normalizeLabel(row?.label), visits: normalizeNumber(row?.nb_visits) }))
      .slice(0, TABLE_LIMIT),
    geoBreakdown: normalizeRows(values.countries)
      .map((row) => ({ country: normalizeLabel(row?.label), visits: normalizeNumber(row?.nb_visits) }))
      .slice(0, TABLE_LIMIT),
    tracking: {
      configured: isMatomoConfigured(),
      version: version || null,
      partial,
      sectionErrors,
      capabilities: {
        siteSearch: !("searchKeywords" in sectionErrors),
        events: !("events" in sectionErrors),
        visitFrequency: !("visitFrequency" in sectionErrors),
      },
    },
  };
}
