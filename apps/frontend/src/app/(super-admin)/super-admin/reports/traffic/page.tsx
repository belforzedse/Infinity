"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DatePicker } from "zaman";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { faNum } from "@/utils/faNum";
import type { MetricDelta, TrafficDashboard, TrafficRealtime } from "@/types/super-admin/reports/traffic";
import { getTrafficDashboard, getTrafficRealtime } from "@/services/super-admin/reports/traffic";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";
import { translateFunnelStep } from "@/utils/statusTranslations";

const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const Legend = dynamic(() => import("recharts").then((m) => m.Legend as any), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });

const TABS = [
  { id: "overview", label: "نمای کلی" },
  { id: "acquisition", label: "جذب کاربر" },
  { id: "content", label: "صفحات و محتوا" },
  { id: "audience", label: "مخاطبان" },
  { id: "engagement", label: "تعامل و جستجو" },
  { id: "ecommerce", label: "فروش و تبدیل" },
  { id: "health", label: "سلامت ردیابی" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const METRIC_HINTS: Record<string, string> = {
  visits: "تعداد دفعاتی که کاربران سایت را مشاهده کرده‌اند (هر نشست یک بازدید).",
  visitors: "تعداد کاربران یکتا در بازه انتخابی.",
  pageviews: "مجموع نمایش صفحات و اکشن‌ها.",
  bounceRate: "درصد بازدیدهایی که تنها یک صفحه دیده و خارج شده‌اند. کمتر بهتر است.",
  avgVisitDuration: "میانگین زمان حضور در هر بازدید.",
  conversionRate: "نسبت سفارش‌های موفق به کل بازدیدها (داده تراکنش از Strapi).",
  revenue: "درآمد قطعی از تراکنش‌های موفق (منبع: Strapi، نه تخمین Matomo).",
};

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatDateTime(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "-";
  return parsed.toLocaleString("fa-IR");
}

function formatPercent(value: number) {
  return `${faNum(value.toFixed(2))}%`;
}

function toFaDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)] || digit);
}

function formatDurationSeconds(totalSeconds: number) {
  const normalized = Math.max(0, Math.round(totalSeconds || 0));
  const hours = Math.floor(normalized / 3600);
  const minutes = Math.floor((normalized % 3600) / 60);
  const seconds = normalized % 60;
  if (hours > 0) {
    return `${toFaDigits(hours)}:${toFaDigits(String(minutes).padStart(2, "0"))}:${toFaDigits(String(seconds).padStart(2, "0"))}`;
  }
  return `${toFaDigits(minutes)}:${toFaDigits(String(seconds).padStart(2, "0"))}`;
}

function formatSecondsSince(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 1000));
}

function formatFunnelStep(step: TrafficDashboard["funnel"][number]["step"]): string {
  return translateFunnelStep(step) || step;
}

function downloadCsv(filename: string, columns: string[], rows: Array<Array<string | number>>) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map(escape).join(",")];
  rows.forEach((row) => lines.push(row.map(escape).join(",")));
  const csv = "﻿" + lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function TrafficReportInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStart = useMemo(() => {
    const fromParam = searchParams.get("from");
    const parsed = fromParam ? new Date(fromParam) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date(Date.now() - 30 * 86400000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const initialEnd = useMemo(() => {
    const toParam = searchParams.get("to");
    const parsed = toParam ? new Date(toParam) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const initialTab = (TABS.find((t) => t.id === searchParams.get("tab"))?.id ?? "overview") as TabId;

  const [start, setStart] = useState<Date>(initialStart);
  const [end, setEnd] = useState<Date>(initialEnd);
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [dashboard, setDashboard] = useState<TrafficDashboard | null>(null);
  const [realtime, setRealtime] = useState<TrafficRealtime | null>(null);
  const [loading, setLoading] = useState(false);
  const [realtimeLoading, setRealtimeLoading] = useState(false);
  const [refreshingNow, setRefreshingNow] = useState(false);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState<number>(15);
  const [clockTick, setClockTick] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const previousRealtimeRef = useRef<TrafficRealtime | null>(null);
  const realtimeInFlightRef = useRef(false);
  const dashboardAbortRef = useRef<AbortController | null>(null);

  const isValid = (value: Date) => value instanceof Date && !Number.isNaN(value.getTime());
  const toIso = useCallback(
    (value: Date, fallback: Date) => (isValid(value) ? value.toISOString() : fallback.toISOString()),
    [],
  );
  const startDate = useMemo(() => toIso(start, new Date(Date.now() - 30 * 86400000)), [start, toIso]);
  const endDate = useMemo(() => toIso(end, new Date()), [end, toIso]);

  // Persist range + tab to the URL so reports are shareable and back/forward works.
  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("from", startDate.slice(0, 10));
    params.set("to", endDate.slice(0, 10));
    params.set("tab", activeTab);
    router.replace(`?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, activeTab]);

  const normalizeDateInput = (value: any, previous: Date): Date => {
    if (value instanceof Date) return value;
    if (value && value.value instanceof Date) return value.value;
    const parsed = new Date(value);
    return isValid(parsed) ? parsed : previous;
  };

  const loadDashboard = useCallback(
    async (options?: { fresh?: boolean; silent?: boolean }) => {
      if (!options?.silent) setLoading(true);
      setError(null);
      dashboardAbortRef.current?.abort();
      const controller = new AbortController();
      dashboardAbortRef.current = controller;
      try {
        const payload = await getTrafficDashboard(
          { startDate, endDate },
          { fresh: options?.fresh === true, signal: controller.signal },
        );
        setDashboard(payload);
      } catch (err) {
        if ((err as any)?.name === "AbortError" || (err as any)?.code === "ERR_CANCELED") return;
        setError(getUserFacingErrorMessage(err, "خطا در بارگذاری گزارش ترافیک"));
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [startDate, endDate],
  );

  const loadRealtime = useCallback(async (options?: { fresh?: boolean; silent?: boolean }) => {
    if (realtimeInFlightRef.current) return;
    realtimeInFlightRef.current = true;
    if (!options?.silent) setRealtimeLoading(true);
    try {
      const payload = await getTrafficRealtime({ fresh: options?.fresh === true });
      setRealtimeError(null);
      setRealtime((previous) => {
        previousRealtimeRef.current = previous;
        return payload;
      });
    } catch (err) {
      setRealtimeError(getUserFacingErrorMessage(err, "خطا در بروزرسانی لحظه‌ای ترافیک"));
    } finally {
      if (!options?.silent) setRealtimeLoading(false);
      realtimeInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadRealtime();
  }, [loadRealtime]);

  useEffect(() => {
    if (autoRefreshSeconds <= 0) return;
    const runSilentRefresh = () => {
      if (document.hidden) return;
      loadRealtime({ silent: true });
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) runSilentRefresh();
    };
    const interval = setInterval(runSilentRefresh, autoRefreshSeconds * 1000);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [autoRefreshSeconds, loadRealtime]);

  useEffect(() => {
    const interval = setInterval(() => setClockTick((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = useCallback(async () => {
    setRefreshingNow(true);
    try {
      await Promise.all([loadDashboard({ fresh: true, silent: true }), loadRealtime({ fresh: true })]);
    } finally {
      setRefreshingNow(false);
    }
  }, [loadDashboard, loadRealtime]);

  const effectiveRealtime = realtime || dashboard?.realtime || null;
  const lastUpdated = realtime?.updatedAt || dashboard?.updatedAt;
  const secondsSinceUpdate = useMemo(() => formatSecondsSince(lastUpdated), [lastUpdated, clockTick]);

  const tracking = dashboard?.tracking;
  const notConfigured = dashboard != null && tracking?.configured === false;
  const partial = tracking?.partial === true;

  const active5Delta =
    realtime && previousRealtimeRef.current
      ? realtime.activeVisitorsLast5Min - previousRealtimeRef.current.activeVisitorsLast5Min
      : 0;
  const active30Delta =
    realtime && previousRealtimeRef.current
      ? realtime.activeVisitorsLast30Min - previousRealtimeRef.current.activeVisitorsLast30Min
      : 0;

  return (
    <ContentWrapper title="گزارش ترافیک و تحلیل رفتار کاربران">
      <div className="space-y-6" dir="rtl">
        {/* Controls */}
        <div className="rounded-2xl bg-white p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h3 className="text-lg font-medium text-neutral-700">بازه گزارش</h3>
                <p className="text-xs mt-1 text-neutral-500">
                  منطقه زمانی: تهران (Asia/Tehran) • مقایسه با دوره قبلی هم‌طول
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:min-w-[450px]">
                <div className="flex flex-col gap-1">
                  <label htmlFor="auto-refresh-select" className="text-xs font-medium text-neutral-500">
                    بروزرسانی لحظه‌ای
                  </label>
                  <select
                    id="auto-refresh-select"
                    value={String(autoRefreshSeconds)}
                    onChange={(e) => setAutoRefreshSeconds(Number(e.target.value))}
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-all focus:border-transparent focus:ring-2 focus:ring-infinity-primary"
                  >
                    <option value="5">هر ۵ ثانیه</option>
                    <option value="15">هر ۱۵ ثانیه</option>
                    <option value="30">هر ۳۰ ثانیه</option>
                    <option value="60">هر ۶۰ ثانیه</option>
                    <option value="0">خاموش</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={refreshingNow}
                  className="self-end rounded-lg bg-infinity-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-infinity-primary-dark disabled:cursor-not-allowed disabled:bg-infinity-primary-lighter"
                >
                  {refreshingNow ? "در حال بروزرسانی..." : "بروزرسانی فوری"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-600">تاریخ شروع</label>
                <DatePicker
                  defaultValue={start}
                  inputClass="w-full rounded-lg border border-neutral-300 px-3 py-2 transition-all focus:border-transparent focus:ring-2 focus:ring-infinity-primary"
                  onChange={(value: any) => setStart(normalizeDateInput(value, start))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-600">تاریخ پایان</label>
                <DatePicker
                  defaultValue={end}
                  inputClass="w-full rounded-lg border border-neutral-300 px-3 py-2 transition-all focus:border-transparent focus:ring-2 focus:ring-infinity-primary"
                  onChange={(value: any) => setEnd(normalizeDateInput(value, end))}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
              <span className="font-medium text-neutral-700">
                {autoRefreshSeconds > 0 ? "وضعیت: زنده" : "وضعیت: بروزرسانی خودکار خاموش"}
              </span>
              <span>•</span>
              <span>
                آخرین داده: {secondsSinceUpdate !== null ? `${faNum(secondsSinceUpdate)} ثانیه پیش` : "نامشخص"}
              </span>
              <span>•</span>
              <span>آخرین بروزرسانی: {formatDateTime(lastUpdated)}</span>
            </div>
            {realtimeError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {realtimeError}
              </div>
            ) : null}
          </div>
        </div>

        {/* Status banners */}
        {notConfigured ? (
          <Banner tone="amber">
            ردیابی Matomo پیکربندی نشده است. مقادیر صفر نمایش داده می‌شوند تا زمانی که اتصال برقرار شود.
          </Banner>
        ) : null}
        {partial && !notConfigured ? (
          <Banner tone="amber">
            برخی بخش‌ها بارگذاری نشدند و داده‌ها ناقص است. سایر بخش‌ها معتبر هستند. جزئیات در تب «سلامت ردیابی».
          </Banner>
        ) : null}
        {error ? <Banner tone="red" onRetry={() => loadDashboard({ fresh: true })}>{error}</Banner> : null}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-neutral-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "border-b-2 border-infinity-primary text-infinity-primary"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && !dashboard ? (
          <DashboardSkeleton />
        ) : (
          <>
            {activeTab === "overview" && (
              <OverviewTab
                dashboard={dashboard}
                effectiveRealtime={effectiveRealtime}
                realtimeLoading={realtimeLoading}
                lastUpdated={lastUpdated}
                active5Delta={active5Delta}
                active30Delta={active30Delta}
              />
            )}
            {activeTab === "acquisition" && <AcquisitionTab dashboard={dashboard} />}
            {activeTab === "content" && <ContentTab dashboard={dashboard} />}
            {activeTab === "audience" && <AudienceTab dashboard={dashboard} />}
            {activeTab === "engagement" && <EngagementTab dashboard={dashboard} />}
            {activeTab === "ecommerce" && <EcommerceTab dashboard={dashboard} />}
            {activeTab === "health" && <HealthTab dashboard={dashboard} lastUpdated={lastUpdated} />}
          </>
        )}
      </div>
    </ContentWrapper>
  );
}

export default function TrafficReportPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <TrafficReportInner />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

function OverviewTab({
  dashboard,
  effectiveRealtime,
  realtimeLoading,
  lastUpdated,
  active5Delta,
  active30Delta,
}: {
  dashboard: TrafficDashboard | null;
  effectiveRealtime: { activeVisitorsLast5Min: number; activeVisitorsLast30Min: number; topPagesNow: Array<{ url: string; visits: number }> } | null;
  realtimeLoading: boolean;
  lastUpdated?: string;
  active5Delta: number;
  active30Delta: number;
}) {
  const trendSeries = dashboard?.series || [];
  const cmp = dashboard?.comparison;
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="بازدیدها" hint={METRIC_HINTS.visits} value={dashboard?.summary.visits ?? 0} delta={cmp?.visits} tone="blue" />
        <MetricCard title="کاربران یکتا" hint={METRIC_HINTS.visitors} value={dashboard?.summary.visitors ?? 0} delta={cmp?.visitors} tone="green" />
        <MetricCard title="نمایش صفحات" hint={METRIC_HINTS.pageviews} value={dashboard?.summary.pageviews ?? 0} delta={cmp?.pageviews} tone="purple" />
        <MetricCard title="نرخ پرش" hint={METRIC_HINTS.bounceRate} value={dashboard?.summary.bounceRate ?? 0} suffix="%" delta={cmp?.bounceRate} invertDelta tone="orange" />
        <MetricCard title="میانگین حضور" hint={METRIC_HINTS.avgVisitDuration} value={formatDurationSeconds(dashboard?.summary.avgVisitDuration ?? 0)} delta={cmp?.avgVisitDuration} tone="blue" />
        <MetricCard title="میانگین اکشن/بازدید" value={dashboard?.summary.avgActionsPerVisit ?? 0} tone="purple" />
        <MetricCard title="تعداد سفارش موفق" value={dashboard?.ecommerce.orders ?? 0} tone="emerald" />
        <MetricCard title="نرخ تبدیل" hint={METRIC_HINTS.conversionRate} value={dashboard?.ecommerce.conversionRate ?? 0} suffix="%" tone="orange" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-neutral-700">روند بازدید و نمایش صفحه</h3>
            <span className="text-xs text-neutral-500">آخرین بروزرسانی: {formatDateTime(lastUpdated)}</span>
          </div>
          {trendSeries.length === 0 ? (
            <EmptyState label="داده‌ای برای نمایش روند وجود ندارد" />
          ) : (
            <div className="h-[340px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="visits" name="بازدید" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="pageviews" name="نمایش صفحه" stroke="#ec4899" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5">
          <h3 className="text-lg mb-4 font-medium text-neutral-700">وضعیت لحظه‌ای</h3>
          <div className="space-y-3">
            <RealtimeMetric label="کاربران فعال ۵ دقیقه اخیر" value={effectiveRealtime?.activeVisitorsLast5Min || 0} delta={active5Delta} />
            <RealtimeMetric label="کاربران فعال ۳۰ دقیقه اخیر" value={effectiveRealtime?.activeVisitorsLast30Min || 0} delta={active30Delta} />
            <div className="text-xs text-neutral-500">
              {realtimeLoading ? "در حال بروزرسانی لحظه‌ای..." : `آخرین بروزرسانی: ${formatDateTime(lastUpdated)}`}
            </div>
          </div>
          <h4 className="text-sm mt-5 font-medium text-neutral-700">صفحات فعال الان</h4>
          <div className="mt-3 space-y-2">
            {(effectiveRealtime?.topPagesNow || []).slice(0, 5).map((row, index) => (
              <div key={row.url} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-xs">
                <span className="line-clamp-1">{`${faNum(index + 1)}. ${row.url}`}</span>
                <span className="font-medium text-neutral-700">{faNum(row.visits)}</span>
              </div>
            ))}
            {!effectiveRealtime?.topPagesNow?.length ? (
              <p className="text-xs text-neutral-500">داده لحظه‌ای صفحه در دسترس نیست.</p>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

function AcquisitionTab({ dashboard }: { dashboard: TrafficDashboard | null }) {
  const acq = dashboard?.acquisition;
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <DataTable
        title="نوع کانال ورود"
        columns={["کانال", "بازدید", "کاربر یکتا"]}
        rows={(acq?.channelTypes || []).map((r) => [r.label, faNum(r.visits), faNum(r.visitors)])}
        csvName="channel-types"
      />
      <DataTable
        title="موتورهای جستجو"
        columns={["موتور جستجو", "بازدید", "کاربر یکتا"]}
        rows={(acq?.searchEngines || []).map((r) => [r.label, faNum(r.visits), faNum(r.visitors)])}
        csvName="search-engines"
      />
      <DataTable
        title="شبکه‌های اجتماعی"
        columns={["شبکه", "بازدید", "کاربر یکتا"]}
        rows={(acq?.socials || []).map((r) => [r.label, faNum(r.visits), faNum(r.visitors)])}
        csvName="socials"
      />
      <DataTable
        title="وب‌سایت‌های ارجاع‌دهنده"
        columns={["منبع", "بازدید", "کاربر یکتا"]}
        rows={(acq?.sources || []).map((r) => [r.source, faNum(r.visits), faNum(r.visitors)])}
        csvName="referrers"
      />
      <DataTable
        title="کمپین‌ها"
        columns={["کمپین", "بازدید", "کاربر یکتا"]}
        rows={(acq?.campaigns || []).map((r) => [r.campaign, faNum(r.visits), faNum(r.visitors)])}
        csvName="campaigns"
      />
    </div>
  );
}

function ContentTab({ dashboard }: { dashboard: TrafficDashboard | null }) {
  const pages = dashboard?.pages;
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <DataTable
        title="پربازدیدترین صفحات"
        columns={["مسیر صفحه", "نمایش", "نمایش یکتا"]}
        rows={(pages?.top || []).map((r) => [r.url, faNum(r.pageviews), faNum(r.uniquePageviews)])}
        csvName="top-pages"
      />
      <DataTable
        title="صفحات ورود (Landing)"
        columns={["صفحه ورود", "ورود", "نرخ پرش"]}
        rows={(pages?.landing || []).map((r) => [r.url, faNum(r.entries), formatPercent(r.bounceRate)])}
        csvName="landing-pages"
      />
      <DataTable
        title="صفحات خروج"
        columns={["صفحه خروج", "خروج", "نرخ خروج"]}
        rows={(pages?.exit || []).map((r) => [r.url, faNum(r.exits), formatPercent(r.exitRate)])}
        csvName="exit-pages"
      />
    </div>
  );
}

function AudienceTab({ dashboard }: { dashboard: TrafficDashboard | null }) {
  const aud = dashboard?.audience;
  const nv = aud?.newVsReturning;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MetricCard title="بازدید کاربران جدید" value={nv?.newVisits ?? 0} tone="green" />
        <MetricCard title="بازدید کاربران بازگشتی" value={nv?.returningVisits ?? 0} tone="blue" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DataTable title="کشور" columns={["کشور", "بازدید"]} rows={(aud?.countries || []).map((r) => [r.country, faNum(r.visits)])} csvName="countries" />
        <DataTable title="نوع دستگاه" columns={["دستگاه", "بازدید"]} rows={(aud?.devices || []).map((r) => [r.device, faNum(r.visits)])} csvName="devices" />
        <DataTable title="مرورگر" columns={["مرورگر", "بازدید"]} rows={(aud?.browsers || []).map((r) => [r.label, faNum(r.visits)])} csvName="browsers" />
        <DataTable title="سیستم‌عامل" columns={["سیستم‌عامل", "بازدید"]} rows={(aud?.operatingSystems || []).map((r) => [r.label, faNum(r.visits)])} csvName="os" />
        <DataTable title="زبان" columns={["زبان", "بازدید"]} rows={(aud?.languages || []).map((r) => [r.label, faNum(r.visits)])} csvName="languages" />
      </div>
    </div>
  );
}

function EngagementTab({ dashboard }: { dashboard: TrafficDashboard | null }) {
  const search = dashboard?.siteSearch;
  const events = dashboard?.funnel || [];
  const siteSearchAvailable = dashboard?.tracking?.capabilities.siteSearch !== false;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {siteSearchAvailable ? (
          <>
            <DataTable
              title="کلیدواژه‌های جستجوی داخل سایت"
              columns={["کلیدواژه", "تعداد جستجو"]}
              rows={(search?.keywords || []).map((r) => [r.keyword, faNum(r.searches)])}
              csvName="site-search-keywords"
            />
            <DataTable
              title="جستجوهای بدون نتیجه"
              columns={["کلیدواژه", "تعداد جستجو"]}
              rows={(search?.noResults || []).map((r) => [r.keyword, faNum(r.searches)])}
              emptyLabel="جستجوی بدون نتیجه‌ای ثبت نشده است"
              csvName="site-search-no-results"
            />
          </>
        ) : (
          <div className="xl:col-span-2">
            <OptionalFeature label="گزارش جستجوی داخل سایت در این نصب Matomo فعال نیست." />
          </div>
        )}
      </div>
      <DataTable
        title="رویدادهای فانل تعامل"
        columns={["مرحله", "تعداد"]}
        rows={events.map((r) => [formatFunnelStep(r.step), faNum(r.count)])}
        emptyLabel="رویدادی ثبت نشده است"
        csvName="funnel-events"
      />
    </div>
  );
}

function EcommerceTab({ dashboard }: { dashboard: TrafficDashboard | null }) {
  const ec = dashboard?.ecommerce;
  const funnelData = dashboard?.funnel || [];
  const aov = ec && ec.orders > 0 ? Math.round(ec.revenue / ec.orders) : 0;
  const funnelChartData = useMemo(
    () => funnelData.map((row) => ({ ...row, stepLabel: formatFunnelStep(row.step) })),
    [funnelData],
  );
  return (
    <div className="space-y-4">
      <p className="text-xs rounded-lg bg-blue-50 px-3 py-2 text-blue-700">
        ارقام فروش و درآمد از داده تراکنشی Strapi است (منبع قطعی)، نه تخمین رفتاری Matomo.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="سفارش موفق" value={ec?.orders ?? 0} tone="emerald" />
        <MetricCard title="کل سفارش‌ها" value={ec?.totalOrders ?? 0} tone="blue" />
        <MetricCard title="درآمد (تومان)" hint={METRIC_HINTS.revenue} value={ec?.revenue ?? 0} tone="brand" />
        <MetricCard title="میانگین ارزش سفارش (تومان)" value={aov} tone="purple" />
      </div>
      <div className="rounded-2xl bg-white p-5">
        <h3 className="text-lg mb-3 font-medium text-neutral-700">فانل تبدیل خرید (رفتاری)</h3>
        {funnelData.length === 0 ? (
          <EmptyState label="داده‌ای برای فانل وجود ندارد" />
        ) : (
          <div className="space-y-3">
            <div className="h-[240px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="stepLabel" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {funnelData.map((row) => (
                <div key={row.step} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                  <span>{formatFunnelStep(row.step)}</span>
                  <span className="font-medium text-neutral-700">
                    {faNum(row.count)}
                    {row.conversionFromPrevious !== null ? ` (${formatPercent(row.conversionFromPrevious)})` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HealthTab({ dashboard, lastUpdated }: { dashboard: TrafficDashboard | null; lastUpdated?: string }) {
  const tracking = dashboard?.tracking;
  const sectionErrors = tracking?.sectionErrors || {};
  const errorKeys = Object.keys(sectionErrors);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          label="اتصال Matomo"
          value={tracking?.configured ? "برقرار" : "پیکربندی نشده"}
          tone={tracking?.configured ? "green" : "amber"}
        />
        <StatusCard label="نسخه Matomo" value={tracking?.version ? toFaDigits(tracking.version) : "نامشخص"} tone="neutral" />
        <StatusCard
          label="سلامت داده"
          value={tracking?.partial ? "ناقص" : "کامل"}
          tone={tracking?.partial ? "amber" : "green"}
        />
        <StatusCard label="آخرین داده موفق" value={formatDateTime(lastUpdated)} tone="neutral" />
      </div>

      <div className="rounded-2xl bg-white p-5">
        <h3 className="text-lg mb-3 font-medium text-neutral-700">قابلیت‌های در دسترس</h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <CapabilityRow label="جستجوی داخل سایت" ok={tracking?.capabilities.siteSearch} />
          <CapabilityRow label="رویدادها (Events)" ok={tracking?.capabilities.events} />
          <CapabilityRow label="کاربر جدید/بازگشتی" ok={tracking?.capabilities.visitFrequency} />
        </div>
        <p className="text-xs mt-3 text-neutral-500">
          قابلیت‌هایی مانند فانل پیشرفته، A/B تست و آنالیز فرم نیازمند افزونه‌های اختیاری/تجاری Matomo هستند و در صورت
          نبود، بدون خطا پنهان می‌شوند.
        </p>
      </div>

      <DataTable
        title="بخش‌های ناموفق در آخرین درخواست"
        columns={["بخش", "کد خطا"]}
        rows={errorKeys.map((key) => [key, sectionErrors[key]])}
        emptyLabel="همه بخش‌ها با موفقیت بارگذاری شدند"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable pieces
// ---------------------------------------------------------------------------

function MetricCard({
  title,
  value,
  suffix,
  tone,
  delta,
  invertDelta,
  hint,
}: {
  title: string;
  value: number | string;
  suffix?: string;
  tone: "blue" | "green" | "purple" | "orange" | "emerald" | "brand";
  delta?: MetricDelta;
  invertDelta?: boolean;
  hint?: string;
}) {
  const toneClass: Record<string, string> = {
    blue: "from-blue-50 to-cyan-50 text-blue-700",
    green: "from-green-50 to-emerald-50 text-emerald-700",
    purple: "from-purple-50 to-indigo-50 text-purple-700",
    orange: "from-orange-50 to-amber-50 text-orange-700",
    emerald: "from-emerald-50 to-teal-50 text-emerald-700",
    brand: "from-infinity-primary-lighter/20 to-infinity-primary-lighter/30 text-infinity-primary-dark",
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-r p-5 ${toneClass[tone]}`}>
      <p className="text-sm mb-2 flex items-center gap-1 font-medium text-neutral-700">
        {title}
        {hint ? (
          <span className="cursor-help text-neutral-400" title={hint} aria-label={hint}>
            ⓘ
          </span>
        ) : null}
      </p>
      <p className="text-2xl font-bold">
        {typeof value === "number" ? faNum(value) : value}
        {suffix ? ` ${suffix}` : ""}
      </p>
      {delta ? <DeltaBadge delta={delta} invert={invertDelta} /> : null}
    </div>
  );
}

function DeltaBadge({ delta, invert }: { delta: MetricDelta; invert?: boolean }) {
  if (delta.changePct === null) {
    return (
      <p className="text-xs mt-1 text-neutral-500" title="دوره قبل مقداری نداشت؛ درصد تغییر تعریف‌نشده است">
        — بدون مبنای مقایسه
      </p>
    );
  }
  const positive = delta.change > 0;
  const isGood = invert ? !positive && delta.change !== 0 : positive;
  const isBad = invert ? positive : !positive && delta.change !== 0;
  const cls = delta.change === 0 ? "text-neutral-500" : isGood ? "text-emerald-600" : isBad ? "text-red-600" : "text-neutral-500";
  const arrow = delta.change === 0 ? "" : positive ? "▲" : "▼";
  return (
    <p className={`text-xs mt-1 font-medium ${cls}`} title="نسبت به دوره قبلی هم‌طول">
      {arrow} {faNum(Math.abs(delta.changePct).toFixed(1))}% ({positive ? "+" : delta.change < 0 ? "-" : ""}
      {faNum(Math.abs(delta.change))})
    </p>
  );
}

function RealtimeMetric({ label, value, delta = 0 }: { label: string; value: number; delta?: number }) {
  const deltaText = delta === 0 ? null : (delta > 0 ? "+" : "-") + faNum(Math.abs(delta));
  const deltaClassName =
    delta > 0 ? "bg-emerald-100 text-emerald-700" : delta < 0 ? "bg-red-100 text-red-700" : "bg-neutral-100 text-neutral-600";
  return (
    <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
      <span className="text-sm text-neutral-600">{label}</span>
      <div className="flex items-center gap-2">
        {deltaText ? <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${deltaClassName}`}>{deltaText}</span> : null}
        <span className="text-lg font-semibold text-infinity-primary">{faNum(value)}</span>
      </div>
    </div>
  );
}

function DataTable({
  title,
  columns,
  rows,
  emptyLabel,
  csvName,
}: {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
  emptyLabel?: string;
  csvName?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-medium text-neutral-700">{title}</h3>
        {csvName && rows.length > 0 ? (
          <button
            type="button"
            onClick={() => downloadCsv(`${csvName}.csv`, columns, rows)}
            className="text-xs rounded-lg border border-neutral-200 px-2 py-1 text-neutral-500 transition hover:bg-neutral-50"
          >
            خروجی CSV
          </button>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <EmptyState label={emptyLabel || "داده‌ای برای این بخش وجود ندارد"} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500">
                {columns.map((column) => (
                  <th key={column} scope="col" className="px-2 py-2 font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((row, index) => (
                <tr key={`${title}-${index}`} className="border-b border-neutral-100">
                  {row.map((value, valueIndex) => (
                    <td key={`${title}-${index}-${valueIndex}`} className="px-2 py-2 text-neutral-700">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusCard({ label, value, tone }: { label: string; value: string; tone: "green" | "amber" | "neutral" }) {
  const toneClass: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    neutral: "bg-neutral-50 text-neutral-700",
  };
  return (
    <div className={`rounded-2xl p-5 ${toneClass[tone]}`}>
      <p className="text-sm mb-2 font-medium text-neutral-600">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function CapabilityRow({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm">
      <span className="text-neutral-600">{label}</span>
      <span className={ok ? "text-emerald-600" : "text-neutral-400"}>{ok ? "فعال ✓" : "در دسترس نیست"}</span>
    </div>
  );
}

function OptionalFeature({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
      {label}
    </div>
  );
}

function Banner({
  tone,
  children,
  onRetry,
}: {
  tone: "amber" | "red";
  children: React.ReactNode;
  onRetry?: () => void;
}) {
  const cls = tone === "red" ? "border-red-100 bg-red-50 text-red-600" : "border-amber-200 bg-amber-50 text-amber-700";
  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${cls}`}>
      <span>{children}</span>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="text-sm shrink-0 rounded-lg bg-white/70 px-3 py-1 font-medium">
          تلاش مجدد
        </button>
      ) : null}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm py-6 text-center text-neutral-500">{label}</p>;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
      <div className="h-[340px] animate-pulse rounded-2xl bg-neutral-100" />
    </div>
  );
}
