"use client";

import { useEffect, useMemo, useState } from "react";
import { faNum } from "@/utils/faNum";
import { getGatewayLiquidity } from "@/services/super-admin/reports/gatewayLiquidity";
import { DatePicker } from "zaman";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import dynamic from "next/dynamic";

const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), {
  ssr: false,
});
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), {
  ssr: false,
});
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), {
  ssr: false,
});
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false },
);
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), {
  ssr: false,
});
const Legend = dynamic(() => import("recharts").then((m) => m.Legend), {
  ssr: false,
});

export default function GatewayLiquidityReportPage() {
  const [start, setStart] = useState<Date>(
    new Date(Date.now() - 30 * 86400000),
  );
  const [end, setEnd] = useState<Date>(new Date());
  const [rows, setRows] = useState<any[]>([]);
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
    getGatewayLiquidity({ start: startISO, end: endISO })
      .then(setRows)
      .finally(() => setLoading(false));
  }, [startISO, endISO]);

  const totalLiquidity = rows.reduce(
    (sum, row) => sum + Number(row.total || 0),
    0,
  );
  const activeGateways = rows.filter(
    (row) => Number(row.total || 0) > 0,
  ).length;

  return (
    <ContentWrapper title="گزارش نقدینگی درگاه‌های پرداخت">
      <div className="space-y-6">
        {/* Filters Section */}
        <div className="rounded-2xl bg-white p-5">
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-medium text-neutral-700">فیلترها</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg mb-2 font-medium text-neutral-700">
                        مجموع نقدینگی
                      </h3>
                      <p className="text-2xl font-bold text-purple-600">
                        {faNum(totalLiquidity)} تومان
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                      <svg
                        className="h-6 w-6 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-orange-100 bg-gradient-to-r from-orange-50 to-red-50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg mb-2 font-medium text-neutral-700">
                        درگاه‌های فعال
                      </h3>
                      <p className="text-2xl font-bold text-orange-600">
                        {faNum(activeGateways)} درگاه
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                      <svg
                        className="h-6 w-6 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Section */}
              <div>
                <h3 className="text-lg mb-4 font-medium text-neutral-700">
                  توزیع نقدینگی بین درگاه‌های پرداخت
                </h3>
                <GatewayLiquidityChart rows={rows} />
              </div>
            </div>
          )}
        </div>
      </div>
    </ContentWrapper>
  );
}

function GatewayLiquidityChart({
  rows,
}: {
  rows: Array<{ gatewayTitle: string; total: number }>;
}) {
  if (!rows || rows.length === 0) {
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
  const chartData = rows.map((row, index) => ({
    name: row.gatewayTitle,
    value: Number(row.total),
    percentage: (
      (Number(row.total) / rows.reduce((sum, r) => sum + Number(r.total), 0)) *
      100
    ).toFixed(1),
  }));

  // Colors for different gateways
  const colors = [
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f59e0b", // amber
    "#10b981", // emerald
    "#ef4444", // red
    "#6366f1", // indigo
    "#84cc16", // lime
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="rounded-lg border border-neutral-200 bg-white p-4 shadow-lg"
          dir="rtl"
        >
          <p className="mb-2 font-medium text-neutral-800">{data.name}</p>
          <div className="text-sm space-y-1">
            <p className="text-purple-600">
              <span className="font-medium">مبلغ:</span> {faNum(data.value)}{" "}
              تومان
            </p>
            <p className="text-neutral-600">
              <span className="font-medium">درصد:</span>{" "}
              {faNum(data.percentage)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom label function
  const renderLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${faNum((percent * 100).toFixed(0))}%`}
      </text>
    );
  };

  return (
    <div className="w-full" dir="rtl">
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start">
        {/* Chart */}
        <div className="flex-shrink-0">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="h-[400px] w-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderLabel}
                    outerRadius={120}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Legend - RTL Layout */}
        <div className="w-full min-w-0 flex-1 lg:w-auto">
          <div className="space-y-3">
            <h4 className="text-sm mb-4 text-right font-medium text-neutral-700">
              درگاه‌های پرداخت
            </h4>
            {chartData.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 transition-colors hover:bg-neutral-100"
                dir="rtl"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className="h-4 w-4 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <div className="min-w-0 flex-1 text-right">
                    <p className="text-sm truncate font-medium text-neutral-700">
                      {item.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {faNum(item.percentage)}% از کل
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right" dir="ltr">
                  <p className="text-sm font-semibold text-neutral-800">
                    {faNum(item.value)}
                  </p>
                  <p className="text-xs text-neutral-500">تومان</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chart summary - RTL */}
          <div className="mt-6 rounded-lg bg-gradient-to-r from-neutral-50 to-neutral-100 p-4">
            <div
              className="text-sm flex items-center justify-between"
              dir="rtl"
            >
              <span className="text-neutral-600">تعداد درگاه‌ها:</span>
              <span className="font-medium text-neutral-800">
                {faNum(rows.length)} درگاه
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
