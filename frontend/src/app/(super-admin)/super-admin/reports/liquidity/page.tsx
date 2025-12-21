"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  LiquidityInterval,
  LiquidityPayload,
} from "@/services/super-admin/reports/liquidity";
import { getLiquidity } from "@/services/super-admin/reports/liquidity";
import { DatePicker } from "zaman";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { faNum } from "@/utils/faNum";
import dynamic from "next/dynamic";

const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), {
  ssr: false,
});
const Line = dynamic(() => import("recharts").then((m) => m.Line), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), {
  ssr: false,
});
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), {
  ssr: false,
});
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), {
  ssr: false,
});

export default function LiquidityReportPage() {
  const [start, setStart] = useState<Date>(new Date(Date.now() - 30 * 86400000));
  const [end, setEnd] = useState<Date>(new Date());
  const [interval, setInterval] = useState<LiquidityInterval>("day");
  const [activePreset, setActivePreset] = useState<number>(30);
  const [data, setData] = useState<LiquidityPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const applyPreset = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    setStart(startDate);
    setEnd(endDate);
    setActivePreset(days);
  };

  const presetOptions = useMemo(
    () => [
      { label: "۷ روز اخیر", days: 7 },
      { label: "۳۰ روز اخیر", days: 30 },
      { label: "۹۰ روز اخیر", days: 90 },
    ],
    [],
  );

  const isValid = (d: Date) => d instanceof Date && !isNaN(d.getTime());
  const toISO = useCallback(
    (d: Date, fallback: Date) => (isValid(d) ? d.toISOString() : fallback.toISOString()),
    [],
  );
  const startISO = useMemo(
    () => toISO(start, new Date(Date.now() - 30 * 86400000)),
    [start, toISO],
  );
  const endISO = useMemo(() => toISO(end, new Date()), [end, toISO]);

  const normalizeDateInput = (d: any, prev: Date): Date => {
    if (d instanceof Date) return d;
    if (d && d.value instanceof Date) return d.value;
    const nd = new Date(d);
    return isValid(nd) ? nd : prev;
  };

  const summary = data?.summary;
  const peakDate = summary?.peakBucket
    ? new Date(summary.peakBucket).toLocaleDateString("fa-IR")
    : "—";
  const deltaPctLabel =
    summary?.deltaPct === null || summary?.deltaPct === undefined
      ? "—"
      : `${faNum(summary.deltaPct.toFixed(1))}%`;
  const deltaTone:
    | "positive"
    | "negative"
    | "neutral" =
    summary?.deltaPct === null || summary?.deltaPct === undefined
      ? "neutral"
      : summary.deltaPct >= 0
      ? "positive"
      : "negative";
  const deltaAbsLabel = summary
    ? `${faNum(summary.deltaAbs || 0)} اختلاف نسبت به دوره قبل`
    : "";

  useEffect(() => {
    setLoading(true);
    getLiquidity({ start: startISO, end: endISO, interval })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [startISO, endISO, interval]);

  return (
    <ContentWrapper title="گزارش مجموع نقدینگی">
      <div className="space-y-6">
        {/* Filters Section */}
        <div className="rounded-2xl bg-white p-5">
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-medium text-neutral-700">فیلترها</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-600">تاریخ شروع</label>
                <DatePicker
                  inputClass="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  defaultValue={start}
                  onChange={(d: any) => {
                    setStart(normalizeDateInput(d, start));
                    setActivePreset(NaN);
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-600">تاریخ پایان</label>
                <DatePicker
                  inputClass="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  defaultValue={end}
                  onChange={(d: any) => {
                    setEnd(normalizeDateInput(d, end));
                    setActivePreset(NaN);
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-600">بازه زمانی</label>
                <select
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 transition-all focus:border-transparent focus:ring-2 focus:ring-pink-500"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value as LiquidityInterval)}
                >
                  <option value="day">روزانه</option>
                  <option value="week">هفتگی</option>
                  <option value="month">ماهانه</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {presetOptions.map((preset) => (
                <button
                  key={preset.days}
                  onClick={() => applyPreset(preset.days)}
                  className={`rounded-full border px-3 py-1 text-sm transition-all ${
                    activePreset === preset.days
                      ? "border-pink-500 bg-pink-50 text-pink-600"
                      : "border-neutral-200 text-neutral-600 hover:border-pink-200 hover:bg-pink-50"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <span className="text-xs text-neutral-400">بازه‌های پیش‌فرض برای مقایسه سریع</span>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="rounded-2xl bg-white p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-pink-500"></div>
                <span className="text-neutral-600">در حال بارگذاری...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="مجموع نقدینگی"
                  value={`${faNum(data?.total || 0)} تومان`}
                  trendLabel={deltaAbsLabel}
                  highlight
                />
                <StatCard
                  title="تغییر دوره قبل"
                  value={deltaPctLabel}
                  trendLabel={
                    deltaTone === "neutral" ? "بدون تغییر محسوس" : deltaTone === "positive" ? "رشد" : "کاهش"
                  }
                  trendTone={deltaTone}
                />
                <StatCard
                  title="میانگین هر بازه"
                  value={`${faNum(Math.round(summary?.averagePerBucket || 0))} تومان`}
                  trendLabel={`${faNum(summary?.bucketCount || 0)} بازه انتخاب شده`}
                />
                <StatCard
                  title="بیشترین نقطه"
                  value={`${faNum(summary?.peakValue || 0)} تومان`}
                  trendLabel={`در ${peakDate}`}
                />
              </div>

              {/* Chart Section */}
              <div>
                <h3 className="text-lg mb-4 font-medium text-neutral-700">نمودار روند نقدینگی</h3>
                <LiquidityChart series={data?.series || []} />
              </div>
            </div>
          )}
        </div>
      </div>
    </ContentWrapper>
  );
}

function StatCard({
  title,
  value,
  trendLabel,
  trendTone = "neutral",
  highlight = false,
}: {
  title: string;
  value: string;
  trendLabel?: string;
  trendTone?: "positive" | "negative" | "neutral";
  highlight?: boolean;
}) {
  const trendColor =
    trendTone === "positive"
      ? "text-emerald-600"
      : trendTone === "negative"
      ? "text-rose-600"
      : "text-neutral-500";

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm transition-all ${
        highlight
          ? "border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50"
          : "border-neutral-100 bg-white"
      }`}
    >
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-600">{title}</span>
        <span className="text-2xl font-bold text-neutral-900">{value}</span>
        {trendLabel ? (
          <span className={`text-xs ${trendColor}`}>{trendLabel}</span>
        ) : null}
      </div>
    </div>
  );
}

function LiquidityChart({ series }: { series: Array<{ bucket: string; total: number }> }) {
  if (!series || series.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <svg
            className="h-8 w-8 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <p className="text-sm text-neutral-500">داده‌ای برای نمایش یافت نشد</p>
        <p className="text-xs mt-1 text-neutral-400">لطفاً بازه زمانی دیگری انتخاب کنید</p>
      </div>
    );
  }

  // Prepare data for Recharts
  const chartData = series.map((item) => ({
    date: new Date(item.bucket).toLocaleDateString("fa-IR", {
      month: "short",
      day: "numeric",
      year: series.length > 30 ? undefined : "numeric",
    }),
    fullDate: new Date(item.bucket).toLocaleDateString("fa-IR"),
    total: Number(item.total),
    bucket: item.bucket,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-lg" dir="rtl">
          <p className="mb-2 font-medium text-neutral-800">{data.fullDate}</p>
          <p className="text-pink-600">
            <span className="font-medium">نقدینگی:</span> {faNum(data.total)} تومان
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" dir="rtl">
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} interval="preserveStartEnd" />
              <YAxis
                tickFormatter={(value) => `${faNum((value / 1000).toFixed(0))}K`}
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="url(#liquidityGradient)"
                strokeWidth={3}
                dot={{ fill: "#ec4899", strokeWidth: 2, r: 4 }}
                activeDot={{
                  r: 6,
                  stroke: "#ec4899",
                  strokeWidth: 2,
                  fill: "#fff",
                }}
              />
              <defs>
                <linearGradient id="liquidityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart legend/info - RTL layout */}
      <div className="text-sm mt-4 flex items-center justify-between text-neutral-600" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
          <span>روند نقدینگی</span>
        </div>
        <div className="text-xs text-neutral-500">{series.length} نقطه داده</div>
      </div>
    </div>
  );
}
