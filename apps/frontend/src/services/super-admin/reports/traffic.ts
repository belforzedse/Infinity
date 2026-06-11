import { apiClient } from "@/services";
import { formatQueryParams } from "@/utils/api";
import type {
  LabeledVisits,
  MetricDelta,
  TrafficDashboard,
  TrafficDashboardParams,
  TrafficRealtime,
} from "@/types/super-admin/reports/traffic";

function normalizeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeBool(value: unknown): boolean {
  return value === true;
}

function normalizeDelta(value: any): MetricDelta {
  return {
    current: normalizeNumber(value?.current),
    previous: normalizeNumber(value?.previous),
    change: normalizeNumber(value?.change),
    changePct: value?.changePct === null || value?.changePct === undefined
      ? null
      : normalizeNumber(value?.changePct),
  };
}

function normalizeLabeled(value: unknown): LabeledVisits[] {
  return Array.isArray(value)
    ? value.map((row: any) => ({
        label: normalizeString(row?.label),
        visits: normalizeNumber(row?.visits),
        visitors: normalizeNumber(row?.visitors),
      }))
    : [];
}

type TrafficRequestOptions = {
  fresh?: boolean;
  signal?: AbortSignal;
};

export async function getTrafficDashboard(
  params?: TrafficDashboardParams,
  options?: TrafficRequestOptions,
): Promise<TrafficDashboard> {
  const query = formatQueryParams({
    ...(params || {}),
    ...(options?.fresh ? { fresh: 1 } : {}),
  } as any);
  const url = `/reports/traffic/dashboard${query}`;
  const response = options?.signal
    ? await apiClient.get(url, { signal: options.signal } as any)
    : await apiClient.get(url);
  const payload = (response as any)?.data || {};

  return {
    range: {
      startDate: normalizeString(payload?.range?.startDate),
      endDate: normalizeString(payload?.range?.endDate),
    },
    comparisonRange: {
      startDate: normalizeString(payload?.comparisonRange?.startDate),
      endDate: normalizeString(payload?.comparisonRange?.endDate),
    },
    summary: {
      visits: normalizeNumber(payload?.summary?.visits),
      visitors: normalizeNumber(payload?.summary?.visitors),
      pageviews: normalizeNumber(payload?.summary?.pageviews),
      bounceRate: normalizeNumber(payload?.summary?.bounceRate),
      avgActionsPerVisit: normalizeNumber(payload?.summary?.avgActionsPerVisit),
      avgVisitDuration: normalizeNumber(payload?.summary?.avgVisitDuration),
    },
    comparison: {
      visits: normalizeDelta(payload?.comparison?.visits),
      visitors: normalizeDelta(payload?.comparison?.visitors),
      pageviews: normalizeDelta(payload?.comparison?.pageviews),
      bounceRate: normalizeDelta(payload?.comparison?.bounceRate),
      avgVisitDuration: normalizeDelta(payload?.comparison?.avgVisitDuration),
    },
    realtime: {
      activeVisitorsLast5Min: normalizeNumber(payload?.realtime?.activeVisitorsLast5Min),
      activeVisitorsLast30Min: normalizeNumber(payload?.realtime?.activeVisitorsLast30Min),
      topPagesNow: Array.isArray(payload?.realtime?.topPagesNow)
        ? payload.realtime.topPagesNow.map((row: any) => ({
            url: normalizeString(row?.url),
            visits: normalizeNumber(row?.visits),
          }))
        : [],
    },
    series: Array.isArray(payload?.series)
      ? payload.series.map((row: any) => ({
          date: normalizeString(row?.date),
          visits: normalizeNumber(row?.visits),
          visitors: normalizeNumber(row?.visitors),
          pageviews: normalizeNumber(row?.pageviews),
        }))
      : [],
    acquisition: {
      channelTypes: normalizeLabeled(payload?.acquisition?.channelTypes),
      sources: Array.isArray(payload?.acquisition?.sources)
        ? payload.acquisition.sources.map((row: any) => ({
            source: normalizeString(row?.source),
            visits: normalizeNumber(row?.visits),
            visitors: normalizeNumber(row?.visitors),
          }))
        : [],
      searchEngines: normalizeLabeled(payload?.acquisition?.searchEngines),
      socials: normalizeLabeled(payload?.acquisition?.socials),
      campaigns: Array.isArray(payload?.acquisition?.campaigns)
        ? payload.acquisition.campaigns.map((row: any) => ({
            campaign: normalizeString(row?.campaign),
            visits: normalizeNumber(row?.visits),
            visitors: normalizeNumber(row?.visitors),
          }))
        : [],
    },
    pages: {
      top: Array.isArray(payload?.pages?.top)
        ? payload.pages.top.map((row: any) => ({
            url: normalizeString(row?.url),
            pageviews: normalizeNumber(row?.pageviews),
            uniquePageviews: normalizeNumber(row?.uniquePageviews),
          }))
        : [],
      landing: Array.isArray(payload?.pages?.landing)
        ? payload.pages.landing.map((row: any) => ({
            url: normalizeString(row?.url),
            entries: normalizeNumber(row?.entries),
            bounceRate: normalizeNumber(row?.bounceRate),
          }))
        : [],
      exit: Array.isArray(payload?.pages?.exit)
        ? payload.pages.exit.map((row: any) => ({
            url: normalizeString(row?.url),
            exits: normalizeNumber(row?.exits),
            exitRate: normalizeNumber(row?.exitRate),
          }))
        : [],
    },
    siteSearch: {
      keywords: Array.isArray(payload?.siteSearch?.keywords)
        ? payload.siteSearch.keywords.map((row: any) => ({
            keyword: normalizeString(row?.keyword),
            searches: normalizeNumber(row?.searches),
            resultsPageviews: normalizeNumber(row?.resultsPageviews),
          }))
        : [],
      noResults: Array.isArray(payload?.siteSearch?.noResults)
        ? payload.siteSearch.noResults.map((row: any) => ({
            keyword: normalizeString(row?.keyword),
            searches: normalizeNumber(row?.searches),
          }))
        : [],
    },
    audience: {
      devices: Array.isArray(payload?.audience?.devices)
        ? payload.audience.devices.map((row: any) => ({
            device: normalizeString(row?.device),
            visits: normalizeNumber(row?.visits),
          }))
        : [],
      browsers: normalizeLabeled(payload?.audience?.browsers),
      operatingSystems: normalizeLabeled(payload?.audience?.operatingSystems),
      languages: normalizeLabeled(payload?.audience?.languages),
      countries: Array.isArray(payload?.audience?.countries)
        ? payload.audience.countries.map((row: any) => ({
            country: normalizeString(row?.country),
            visits: normalizeNumber(row?.visits),
          }))
        : [],
      newVsReturning: {
        newVisits: normalizeNumber(payload?.audience?.newVsReturning?.newVisits),
        returningVisits: normalizeNumber(payload?.audience?.newVsReturning?.returningVisits),
      },
    },
    funnel: Array.isArray(payload?.funnel)
      ? payload.funnel.map((row: any) => ({
          step: row?.step as TrafficDashboard["funnel"][number]["step"],
          count: normalizeNumber(row?.count),
          conversionFromPrevious:
            row?.conversionFromPrevious === null
              ? null
              : normalizeNumber(row?.conversionFromPrevious),
        }))
      : [],
    deviceBreakdown: Array.isArray(payload?.deviceBreakdown)
      ? payload.deviceBreakdown.map((row: any) => ({
          device: normalizeString(row?.device),
          visits: normalizeNumber(row?.visits),
        }))
      : [],
    geoBreakdown: Array.isArray(payload?.geoBreakdown)
      ? payload.geoBreakdown.map((row: any) => ({
          country: normalizeString(row?.country),
          visits: normalizeNumber(row?.visits),
        }))
      : [],
    ecommerce: {
      orders: normalizeNumber(payload?.ecommerce?.orders),
      totalOrders: normalizeNumber(payload?.ecommerce?.totalOrders),
      revenue: normalizeNumber(payload?.ecommerce?.revenue),
      conversionRate: normalizeNumber(payload?.ecommerce?.conversionRate),
    },
    tracking: {
      configured: normalizeBool(payload?.tracking?.configured),
      version: payload?.tracking?.version ? normalizeString(payload.tracking.version) : null,
      partial: normalizeBool(payload?.tracking?.partial),
      sectionErrors:
        payload?.tracking?.sectionErrors && typeof payload.tracking.sectionErrors === "object"
          ? payload.tracking.sectionErrors
          : {},
      capabilities: {
        siteSearch: normalizeBool(payload?.tracking?.capabilities?.siteSearch),
        events: normalizeBool(payload?.tracking?.capabilities?.events),
        visitFrequency: normalizeBool(payload?.tracking?.capabilities?.visitFrequency),
      },
    },
    updatedAt: normalizeString(payload?.updatedAt),
  };
}

export async function getTrafficRealtime(options?: TrafficRequestOptions): Promise<TrafficRealtime> {
  const query = formatQueryParams(options?.fresh ? ({ fresh: 1 } as any) : ({} as any));
  const url = `/reports/traffic/realtime${query}`;
  const response = options?.signal
    ? await apiClient.get(url, { signal: options.signal } as any)
    : await apiClient.get(url);
  const payload = (response as any)?.data || {};
  return {
    activeVisitorsLast5Min: normalizeNumber(payload?.activeVisitorsLast5Min),
    activeVisitorsLast30Min: normalizeNumber(payload?.activeVisitorsLast30Min),
    topPagesNow: Array.isArray(payload?.topPagesNow)
      ? payload.topPagesNow.map((row: any) => ({
          url: normalizeString(row?.url),
          visits: normalizeNumber(row?.visits),
        }))
      : [],
    updatedAt: normalizeString(payload?.updatedAt),
  };
}
