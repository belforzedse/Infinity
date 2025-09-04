"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getLiquidity,
  LiquidityInterval,
} from "@/services/super-admin/reports/liquidity";
import { DatePicker } from "zaman";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { faNum } from "@/utils/faNum";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function LiquidityReportPage() {
  const [start, setStart] = useState<Date>(
    new Date(Date.now() - 30 * 86400000),
  );
  const [end, setEnd] = useState<Date>(new Date());
  const [interval, setInterval] = useState<LiquidityInterval>("day");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const isValid = (d: Date) => d instanceof Date && !isNaN(d.getTime());
  const toISO = (d: Date, fallback: Date) =>
    isValid(d) ? d.toISOString() : fallback.toISOString();
  const startISO = useMemo(
    () => toISO(start, new Date(Date.now() - 30 * 86400000)),
    [start],
  );
  const endISO = useMemo(() => toISO(end, new Date()), [end]);

  const normalizeDateInput = (d: any, prev: Date): Date => {
    if (d instanceof Date) return d;
    if (d && d.value instanceof Date) return d.value;
    const nd = new Date(d);
    return isValid(nd) ? nd : prev;
  };

  useEffect(() => {
    setLoading(true);
    getLiquidity({ start: startISO, end: endISO, interval })
      .then(setData)
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
                <label className="text-sm font-medium text-neutral-600">
                  تاریخ شروع
                </label>
                <DatePicker
                  inputClass="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  defaultValue={start}
                  onChange={(d: any) => setStart(normalizeDateInput(d, start))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-600">
                  تاریخ پایان
                </label>
                <DatePicker
                  inputClass="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  defaultValue={end}
                  onChange={(d: any) => setEnd(normalizeDateInput(d, end))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-600">
                  بازه زمانی
                </label>
                <select
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 transition-all focus:border-transparent focus:ring-2 focus:ring-pink-500"
                  value={interval}
                  onChange={(e) =>
                    setInterval(e.target.value as LiquidityInterval)
                  }
                >
                  <option value="day">روزانه</option>
                  <option value="week">هفتگی</option>
                  <option value="month">ماهانه</option>
                </select>
              </div>
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
              {/* Summary Card */}
              <div className="rounded-xl border border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg mb-2 font-medium text-neutral-700">
                      مجموع نقدینگی
                    </h3>
                    <p className="text-3xl font-bold text-pink-600">
                      {faNum(data?.total || 0)} تومان
                    </p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-100">
                    <svg
                      className="h-8 w-8 text-pink-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Chart Section */}
              <div>
                <h3 className="text-lg mb-4 font-medium text-neutral-700">
                  نمودار روند نقدینگی
                </h3>
                <LiquidityChart series={data?.series || []} />
              </div>
            </div>
          )}
        </div>
      </div>
    </ContentWrapper>
  );
}

function LiquidityChart({
  series,
}: {
  series: Array<{ bucket: string; total: number }>;
}) {
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
        <p className="text-xs mt-1 text-neutral-400">
          لطفاً بازه زمانی دیگری انتخاب کنید
        </p>
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
        <div
          className="rounded-lg border border-neutral-200 bg-white p-4 shadow-lg"
          dir="rtl"
        >
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
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={12}
                interval="preserveStartEnd"
              />
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
                <linearGradient
                  id="liquidityGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart legend/info - RTL layout */}
      <div
        className="text-sm mt-4 flex items-center justify-between text-neutral-600"
        dir="rtl"
      >
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
          <span>روند نقدینگی</span>
        </div>
        <div className="text-xs text-neutral-500">
          {series.length} نقطه داده
        </div>
      </div>
    </div>
  );
}
