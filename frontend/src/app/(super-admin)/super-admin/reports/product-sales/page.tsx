"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getProductSales } from "@/services/super-admin/reports/productSales";
import { DatePicker } from "zaman";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { faNum } from "@/utils/faNum";
import dynamic from "next/dynamic";

const RechartsTooltip = dynamic(
  () => import("recharts").then((m) => m.Tooltip),
  { ssr: false },
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false },
);
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), {
  ssr: false,
});
const Treemap = dynamic(() => import("recharts").then((m) => m.Treemap), {
  ssr: false,
});

export default function ProductSalesReportPage() {
  const [start, setStart] = useState<Date>(
    new Date(Date.now() - 30 * 86400000),
  );
  const [end, setEnd] = useState<Date>(new Date());
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const isValid = (d: Date) => d instanceof Date && !isNaN(d.getTime());
  const toISO = useCallback(
    (d: Date, fallback: Date) =>
      isValid(d) ? d.toISOString() : fallback.toISOString(),
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

  useEffect(() => {
    setLoading(true);
    getProductSales({ start: startISO, end: endISO })
      .then(setRows)
      .finally(() => setLoading(false));
  }, [startISO, endISO]);

  const totalRevenue = rows.reduce(
    (sum, row) => sum + Number(row.totalRevenue || 0),
    0,
  );
  const totalCount = rows.reduce(
    (sum, row) => sum + Number(row.totalCount || 0),
    0,
  );

  return (
    <ContentWrapper title="گزارش فروش محصولات">
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
                <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg mb-2 font-medium text-neutral-700">
                        مجموع فروش
                      </h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {faNum(totalRevenue)} تومان
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                      <svg
                        className="h-6 w-6 text-blue-600"
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
                <div className="rounded-xl border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg mb-2 font-medium text-neutral-700">
                        تعداد فروش
                      </h3>
                      <p className="text-2xl font-bold text-green-600">
                        {faNum(totalCount)} عدد
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <svg
                        className="h-6 w-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Section */}
              <div>
                <h3 className="text-lg mb-4 font-medium text-neutral-700">
                  نمودار فروش محصولات (۲۰ محصول برتر)
                </h3>
                <ProductSalesTreemap rows={rows} />
              </div>
            </div>
          )}
        </div>
      </div>
    </ContentWrapper>
  );
}

function ProductSalesTreemap({
  rows,
}: {
  rows: Array<{
    productTitle: string;
    totalRevenue: number;
    totalCount: number;
  }>;
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

  // Prepare data (top products)
  const data = rows
    .slice(0, 20)
    .map((row, index) => ({
      name: row.productTitle,
      display:
        row.productTitle.length > 18
          ? row.productTitle.slice(0, 18) + "…"
          : row.productTitle,
      revenue: Number(row.totalRevenue),
      count: Number(row.totalCount),
      rank: index + 1,
    }))
    .filter((d) => Number.isFinite(d.revenue) && d.revenue > 0);

  const colors = [
    "#2563eb",
    "#7c3aed",
    "#06b6d4",
    "#f59e0b",
    "#10b981",
    "#ef4444",
    "#8b5cf6",
    "#84cc16",
  ];

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
            <p className="text-blue-600">
              <span className="font-medium">درآمد:</span> {faNum(data.revenue)}{" "}
              تومان
            </p>
            <p className="text-green-600">
              <span className="font-medium">تعداد:</span> {faNum(data.count)}{" "}
              عدد
            </p>
            <p className="text-amber-600">
              <span className="font-medium">رتبه:</span> {faNum(data.rank)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" dir="rtl">
      <div className="rounded-xl border border-neutral-200 bg-white p-2 md:p-4">
        <div className="h-[600px] md:h-[700px]" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={data}
              dataKey="revenue"
              nameKey="display"
              aspectRatio={4 / 3}
              stroke="#ffffff"
              fill="#3b82f6"
              isAnimationActive={false}
            >
              {data.map((_, i) => (
                <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
              ))}
              <RechartsTooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart info - RTL layout */}
      <div
        className="text-sm mt-4 flex flex-col justify-between gap-2 text-neutral-600 md:flex-row md:items-center"
        dir="rtl"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            <span>۳ محصول برتر</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gray-500"></div>
            <span>سایر محصولات</span>
          </div>
        </div>
        <div className="text-xs text-neutral-500">
          <span className="md:hidden">
            نمایش {faNum(Math.min(rows.length, 8))} محصول از{" "}
            {faNum(rows.length)} محصول
          </span>
          <span className="hidden md:inline">
            نمایش {faNum(Math.min(rows.length, 20))} محصول از{" "}
            {faNum(rows.length)} محصول
          </span>
        </div>
      </div>
    </div>
  );
}
