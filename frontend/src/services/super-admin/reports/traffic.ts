import { apiClient } from "@/services";
import { formatQueryParams } from "@/utils/api";
import type {
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

export async function getTrafficDashboard(params?: TrafficDashboardParams): Promise<TrafficDashboard> {
  const query = formatQueryParams(params as any);
  const response = await apiClient.get(`/reports/traffic/dashboard${query}`);
  const payload = (response as any)?.data || {};

  return {
    range: {
      startDate: normalizeString(payload?.range?.startDate),
      endDate: normalizeString(payload?.range?.endDate),
    },
    summary: {
      visits: normalizeNumber(payload?.summary?.visits),
      visitors: normalizeNumber(payload?.summary?.visitors),
      pageviews: normalizeNumber(payload?.summary?.pageviews),
      bounceRate: normalizeNumber(payload?.summary?.bounceRate),
      avgActionsPerVisit: normalizeNumber(payload?.summary?.avgActionsPerVisit),
      avgVisitDuration: normalizeNumber(payload?.summary?.avgVisitDuration),
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
      sources: Array.isArray(payload?.acquisition?.sources)
        ? payload.acquisition.sources.map((row: any) => ({
            source: normalizeString(row?.source),
            visits: normalizeNumber(row?.visits),
            visitors: normalizeNumber(row?.visitors),
          }))
        : [],
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
    updatedAt: normalizeString(payload?.updatedAt),
  };
}

export async function getTrafficRealtime(): Promise<TrafficRealtime> {
  const response = await apiClient.get("/reports/traffic/realtime");
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
