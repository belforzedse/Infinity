"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DatePicker } from "zaman";
import dynamic from "next/dynamic";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { faNum } from "@/utils/faNum";
import type { TrafficDashboard, TrafficRealtime } from "@/types/super-admin/reports/traffic";
import { getTrafficDashboard, getTrafficRealtime } from "@/services/super-admin/reports/traffic";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";
import { translateFunnelStep } from "@/utils/statusTranslations";

const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), {
  ssr: false,
});
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });

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
  const seconds = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 1000));
  return seconds;
}

function formatFunnelStep(step: TrafficDashboard["funnel"][number]["step"]): string {
  return translateFunnelStep(step) || step;
}

export default function TrafficReportPage() {
  const [start, setStart] = useState<Date>(new Date(Date.now() - 30 * 86400000));
  const [end, setEnd] = useState<Date>(new Date());
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

  const isValid = (value: Date) => value instanceof Date && !Number.isNaN(value.getTime());
  const toIso = useCallback(
    (value: Date, fallback: Date) => (isValid(value) ? value.toISOString() : fallback.toISOString()),
    [],
  );
  const startDate = useMemo(
    () => toIso(start, new Date(Date.now() - 30 * 86400000)),
    [start, toIso],
  );
  const endDate = useMemo(() => toIso(end, new Date()), [end, toIso]);

  const normalizeDateInput = (value: any, previous: Date): Date => {
    if (value instanceof Date) return value;
    if (value && value.value instanceof Date) return value.value;
    const parsed = new Date(value);
    return isValid(parsed) ? parsed : previous;
  };

  const loadDashboard = useCallback(async (options?: { fresh?: boolean; silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const payload = await getTrafficDashboard(
        {
          startDate,
          endDate,
        },
        { fresh: options?.fresh === true },
      );
      setDashboard(payload);
    } catch (err) {
      setError(getUserFacingErrorMessage(err, "خطا در بارگذاری گزارش ترافیک"));
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [startDate, endDate]);

  const loadRealtime = useCallback(async (options?: { fresh?: boolean; silent?: boolean }) => {
    if (realtimeInFlightRef.current) return;
    realtimeInFlightRef.current = true;
    if (!options?.silent) {
      setRealtimeLoading(true);
    }

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
      if (!options?.silent) {
        setRealtimeLoading(false);
      }
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
      if (!document.hidden) {
        runSilentRefresh();
      }
    };

    const interval = setInterval(runSilentRefresh, autoRefreshSeconds * 1000);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [autoRefreshSeconds, loadRealtime]);

  useEffect(() => {
    const interval = setInterval(() => {
      setClockTick((previous) => previous + 1);
    }, 1_000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = useCallback(async () => {
    setRefreshingNow(true);
    try {
      await Promise.all([
        loadDashboard({ fresh: true, silent: true }),
        loadRealtime({ fresh: true }),
      ]);
    } finally {
      setRefreshingNow(false);
    }
  }, [loadDashboard, loadRealtime]);

  const effectiveRealtime = realtime || dashboard?.realtime || null;
  const lastUpdated = realtime?.updatedAt || dashboard?.updatedAt;
  const secondsSinceUpdate = useMemo(
    () => formatSecondsSince(lastUpdated),
    [lastUpdated, clockTick],
  );

  const trendSeries = dashboard?.series || [];
  const funnelData = dashboard?.funnel || [];
  const funnelChartData = useMemo(
    () =>
      funnelData.map((row) => ({
        ...row,
        stepLabel: formatFunnelStep(row.step),
      })),
    [funnelData],
  );
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
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <h3 className="text-lg font-medium text-neutral-700">بازه گزارش</h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:min-w-[450px]">
                <div className="flex flex-col gap-1">
                  <label htmlFor="auto-refresh-select" className="text-xs font-medium text-neutral-500">
                    بروزرسانی لحظه‌ای
                  </label>
                  <select
                    id="auto-refresh-select"
                    value={String(autoRefreshSeconds)}
                    onChange={(event) => setAutoRefreshSeconds(Number(event.target.value))}
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-all focus:border-transparent focus:ring-2 focus:ring-pink-500"
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
                  className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-300"
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
                  inputClass="w-full rounded-lg border border-neutral-300 px-3 py-2 transition-all focus:border-transparent focus:ring-2 focus:ring-pink-500"
                  onChange={(value: any) => setStart(normalizeDateInput(value, start))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-600">تاریخ پایان</label>
                <DatePicker
                  defaultValue={end}
                  inputClass="w-full rounded-lg border border-neutral-300 px-3 py-2 transition-all focus:border-transparent focus:ring-2 focus:ring-pink-500"
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
                آخرین داده:
                {" "}
                {secondsSinceUpdate !== null ? `${faNum(secondsSinceUpdate)} ثانیه پیش` : "نامشخص"}
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

        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600">{error}</div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-neutral-500">در حال بارگذاری...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="بازدیدها" value={dashboard?.summary.visits || 0} tone="blue" />
              <MetricCard title="کاربران یکتا" value={dashboard?.summary.visitors || 0} tone="green" />
              <MetricCard title="نمایش صفحات" value={dashboard?.summary.pageviews || 0} tone="purple" />
              <MetricCard
                title="نرخ پرش"
                value={dashboard?.summary.bounceRate || 0}
                suffix="%"
                tone="orange"
              />
              <MetricCard
                title="میانگین حضور"
                value={formatDurationSeconds(dashboard?.summary.avgVisitDuration || 0)}
                tone="blue"
              />
              <MetricCard
                title="میانگین اکشن/بازدید"
                value={dashboard?.summary.avgActionsPerVisit || 0}
                tone="purple"
              />
              <MetricCard
                title="تعداد سفارش موفق"
                value={dashboard?.ecommerce.orders || 0}
                tone="emerald"
              />
              <MetricCard
                title="نرخ تبدیل"
                value={dashboard?.ecommerce.conversionRate || 0}
                suffix="%"
                tone="orange"
              />
              <MetricCard
                title="درآمد (تومان)"
                value={dashboard?.ecommerce.revenue || 0}
                tone="pink"
              />
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
                        <Line type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="pageviews" stroke="#ec4899" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white p-5">
                <h3 className="text-lg mb-4 font-medium text-neutral-700">وضعیت لحظه‌ای</h3>
                <div className="space-y-3">
                  <RealtimeMetric
                    label="کاربران فعال ۵ دقیقه اخیر"
                    value={effectiveRealtime?.activeVisitorsLast5Min || 0}
                    delta={active5Delta}
                  />
                  <RealtimeMetric
                    label="کاربران فعال ۳۰ دقیقه اخیر"
                    value={effectiveRealtime?.activeVisitorsLast30Min || 0}
                    delta={active30Delta}
                  />
                  <div className="text-xs text-neutral-500">
                    {realtimeLoading
                      ? "در حال بروزرسانی لحظه‌ای..."
                      : `آخرین بروزرسانی: ${formatDateTime(lastUpdated)}`}
                  </div>
                </div>
                <h4 className="text-sm mt-5 font-medium text-neutral-700">صفحات فعال الان</h4>
                <div className="mt-3 space-y-2">
                  {(effectiveRealtime?.topPagesNow || []).slice(0, 5).map((row, index) => (
                    <div
                      key={row.url}
                      className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-xs"
                    >
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

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <DataTable
                title="منابع ورودی (Source)"
                columns={["منبع", "بازدید", "کاربر یکتا"]}
                rows={(dashboard?.acquisition.sources || []).map((row) => [
                  row.source,
                  faNum(row.visits),
                  faNum(row.visitors),
                ])}
              />
              <DataTable
                title="کمپین‌ها"
                columns={["کمپین", "بازدید", "کاربر یکتا"]}
                rows={(dashboard?.acquisition.campaigns || []).map((row) => [
                  row.campaign,
                  faNum(row.visits),
                  faNum(row.visitors),
                ])}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <DataTable
                title="پربازدیدترین صفحات"
                columns={["مسیر صفحه", "نمایش", "نمایش یکتا"]}
                rows={(dashboard?.pages.top || []).map((row) => [
                  row.url,
                  faNum(row.pageviews),
                  faNum(row.uniquePageviews),
                ])}
              />
              <DataTable
                title="لندینگ‌ها"
                columns={["صفحه ورود", "ورود", "نرخ پرش"]}
                rows={(dashboard?.pages.landing || []).map((row) => [
                  row.url,
                  faNum(row.entries),
                  formatPercent(row.bounceRate),
                ])}
              />
              <DataTable
                title="خروجی‌ها"
                columns={["صفحه خروج", "خروج", "نرخ خروج"]}
                rows={(dashboard?.pages.exit || []).map((row) => [
                  row.url,
                  faNum(row.exits),
                  formatPercent(row.exitRate),
                ])}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-2xl bg-white p-5">
                <h3 className="text-lg mb-3 font-medium text-neutral-700">فانل تبدیل خرید</h3>
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
                        <div
                          key={row.step}
                          className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm"
                        >
                          <span>{formatFunnelStep(row.step)}</span>
                          <span className="font-medium text-neutral-700">
                            {faNum(row.count)}
                            {row.conversionFromPrevious !== null
                              ? ` (${formatPercent(row.conversionFromPrevious)})`
                              : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white p-5">
                <h3 className="text-lg mb-3 font-medium text-neutral-700">دستگاه و جغرافیا</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SimpleList
                    title="نوع دستگاه"
                    rows={(dashboard?.deviceBreakdown || []).map((row) => ({
                      label: row.device,
                      value: faNum(row.visits),
                    }))}
                  />
                  <SimpleList
                    title="کشور"
                    rows={(dashboard?.geoBreakdown || []).map((row) => ({
                      label: row.country,
                      value: faNum(row.visits),
                    }))}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ContentWrapper>
  );
}

function MetricCard({
  title,
  value,
  suffix,
  tone,
}: {
  title: string;
  value: number | string;
  suffix?: string;
  tone: "blue" | "green" | "purple" | "orange" | "emerald" | "pink";
}) {
  const toneClass: Record<string, string> = {
    blue: "from-blue-50 to-cyan-50 text-blue-700",
    green: "from-green-50 to-emerald-50 text-emerald-700",
    purple: "from-purple-50 to-indigo-50 text-purple-700",
    orange: "from-orange-50 to-amber-50 text-orange-700",
    emerald: "from-emerald-50 to-teal-50 text-emerald-700",
    pink: "from-pink-50 to-rose-50 text-pink-700",
  };

  return (
    <div className={`rounded-2xl bg-gradient-to-r p-5 ${toneClass[tone]}`}>
      <p className="text-sm mb-2 font-medium text-neutral-700">{title}</p>
      <p className="text-2xl font-bold">
        {typeof value === "number" ? faNum(value) : value}
        {suffix ? ` ${suffix}` : ""}
      </p>
    </div>
  );
}

function RealtimeMetric({
  label,
  value,
  delta = 0,
}: {
  label: string;
  value: number;
  delta?: number;
}) {
  const deltaText =
    delta === 0 ? null : (delta > 0 ? "+" : "-") + faNum(Math.abs(delta));
  const deltaClassName =
    delta > 0
      ? "bg-emerald-100 text-emerald-700"
      : delta < 0
        ? "bg-red-100 text-red-700"
        : "bg-neutral-100 text-neutral-600";

  return (
    <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
      <span className="text-sm text-neutral-600">{label}</span>
      <div className="flex items-center gap-2">
        {deltaText ? (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${deltaClassName}`}>
            {deltaText}
          </span>
        ) : null}
        <span className="text-lg font-semibold text-pink-600">{faNum(value)}</span>
      </div>
    </div>
  );
}

function DataTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: string[][];
}) {
  return (
    <div className="rounded-2xl bg-white p-5">
      <h3 className="text-lg mb-3 font-medium text-neutral-700">{title}</h3>
      {rows.length === 0 ? (
        <EmptyState label="داده‌ای برای این بخش وجود ندارد" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500">
                {columns.map((column) => (
                  <th key={column} className="px-2 py-2 font-medium">
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

function SimpleList({ title, rows }: { title: string; rows: Array<{ label: string; value: string }> }) {
  return (
    <div>
      <h4 className="text-sm mb-2 font-medium text-neutral-600">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-xs text-neutral-500">داده‌ای وجود ندارد</p>
      ) : (
        <div className="space-y-2">
          {rows.slice(0, 8).map((row) => (
            <div
              key={`${title}-${row.label}`}
              className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm"
            >
              <span>{row.label}</span>
              <span className="font-medium text-neutral-700">{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm py-6 text-center text-neutral-500">{label}</p>;
}
