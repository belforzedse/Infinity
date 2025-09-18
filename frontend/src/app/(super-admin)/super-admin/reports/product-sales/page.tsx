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
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), {
  ssr: false,
});
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), {
  ssr: false,
});
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => m.CartesianGrid),
  {
    ssr: false,
  },
);
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), {
  ssr: false,
});
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), {
  ssr: false,
});
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), {
  ssr: false,
});
const Line = dynamic(() => import("recharts").then((m) => m.Line), {
  ssr: false,
});
const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), {
  ssr: false,
});
const Area = dynamic(() => import("recharts").then((m) => m.Area), {
  ssr: false,
});

type ChartType = "treemap" | "bar" | "pie" | "line" | "area";

export default function ProductSalesReportPage() {
  const [start, setStart] = useState<Date>(
    new Date(Date.now() - 30 * 86400000),
  );
  const [end, setEnd] = useState<Date>(new Date());
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<ChartType>("treemap");
  const [showTop, setShowTop] = useState<number>(20);

  // Excel export function
  const exportToExcel = useCallback(
    async (data: any[], startDate: Date, endDate: Date) => {
      if (!data || data.length === 0) {
        alert("داده‌ای برای خروجی وجود ندارد");
        return;
      }

      try {
        // Try different import methods for XLSX
        let XLSX;
        try {
          // Method 1: Try dynamic import
          XLSX = await import("xlsx");
        } catch {
          try {
            // Method 2: Try another dynamic import (fallback)
            XLSX = (await import("xlsx")).default;
          } catch {
            throw new Error("xlsx package not found");
          }
        }

        // Prepare data for Excel export
        const exportData = data.map((row, index) => ({
          رتبه: index + 1,
          "نام محصول": row.productTitle || "",
          "مجموع درآمد (تومان)": Number(row.totalRevenue) || 0,
          "تعداد فروش": Number(row.totalCount) || 0,
          "قیمت متوسط (تومان)": Math.round(
            (Number(row.totalRevenue) || 0) / (Number(row.totalCount) || 1),
          ),
          "درصد از کل درآمد":
            (
              ((Number(row.totalRevenue) || 0) /
                data.reduce(
                  (sum, item) => sum + (Number(item.totalRevenue) || 0),
                  0,
                )) *
              100
            ).toFixed(2) + "%",
        }));

        // Add summary row
        const totalRevenue = data.reduce(
          (sum, row) => sum + (Number(row.totalRevenue) || 0),
          0,
        );
        const totalCount = data.reduce(
          (sum, row) => sum + (Number(row.totalCount) || 0),
          0,
        );

        exportData.push({
          رتبه: data.length + 1,
          "نام محصول": "مجموع کل",
          "مجموع درآمد (تومان)": totalRevenue,
          "تعداد فروش": totalCount,
          "قیمت متوسط (تومان)": Math.round(totalRevenue / (totalCount || 1)),
          "درصد از کل درآمد": "100%",
        });

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Set column widths
        ws["!cols"] = [
          { wch: 8 }, // رتبه
          { wch: 40 }, // نام محصول
          { wch: 20 }, // مجموع درآمد
          { wch: 15 }, // تعداد فروش
          { wch: 20 }, // قیمت متوسط
          { wch: 18 }, // درصد از کل درآمد
        ];

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "گزارش فروش محصولات");

        // Add metadata sheet
        const metaData = [
          { شرح: "تاریخ شروع", مقدار: startDate.toLocaleDateString("fa-IR") },
          { شرح: "تاریخ پایان", مقدار: endDate.toLocaleDateString("fa-IR") },
          {
            شرح: "تاریخ تهیه گزارش",
            مقدار: new Date().toLocaleDateString("fa-IR"),
          },
          { شرح: "تعداد محصولات", مقدار: String(data.length) },
          { شرح: "مجموع درآمد", مقدار: faNum(totalRevenue) + " تومان" },
          { شرح: "مجموع فروش", مقدار: faNum(totalCount) + " عدد" },
        ];

        const metaWs = XLSX.utils.json_to_sheet(metaData);
        metaWs["!cols"] = [{ wch: 20 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, metaWs, "اطلاعات گزارش");

        // Generate filename
        const filename = `گزارش-فروش-محصولات-${startDate.toLocaleDateString("fa-IR").replace(/\//g, "-")}-تا-${endDate.toLocaleDateString("fa-IR").replace(/\//g, "-")}.xlsx`;

        // Download file
        XLSX.writeFile(wb, filename);

        // Success message
        alert("فایل Excel با موفقیت ایجاد شد!");
      } catch (error: unknown) {
        console.error("Error exporting to Excel:", error);

        // More specific error messages
        if (
          error instanceof Error &&
          error.message.includes("xlsx package not found")
        ) {
          alert(
            "پکیج xlsx یافت نشد. لطفاً دستور زیر را اجرا کنید:\nnpm install xlsx",
          );
        } else {
          alert(
            `خطا در ایجاد فایل Excel: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    },
    [],
  );

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
  const avgRevenue = rows.length > 0 ? totalRevenue / rows.length : 0;

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
              {/* Enhanced Summary Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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

                <div className="rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg mb-2 font-medium text-neutral-700">
                        متوسط درآمد
                      </h3>
                      <p className="text-2xl font-bold text-purple-600">
                        {faNum(Math.round(avgRevenue))} تومان
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
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg mb-2 font-medium text-neutral-700">
                        تعداد محصولات
                      </h3>
                      <p className="text-2xl font-bold text-orange-600">
                        {faNum(rows.length)} محصول
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
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Chart Section */}
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-lg font-medium text-neutral-700">
                    نمودار فروش محصولات
                  </h3>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-neutral-600">
                        نمایش:
                      </label>
                      <select
                        value={showTop}
                        onChange={(e) => setShowTop(Number(e.target.value))}
                        className="text-sm rounded-lg border border-neutral-300 px-3 py-1 focus:border-transparent focus:ring-2 focus:ring-pink-500"
                      >
                        <option value={10}>۱۰ محصول برتر</option>
                        <option value={15}>۱۵ محصول برتر</option>
                        <option value={20}>۲۰ محصول برتر</option>
                        <option value={rows.length}>همه محصولات</option>
                      </select>
                    </div>

                    {/* Export Button */}
                    <button
                      onClick={() => exportToExcel(rows, start, end)}
                      disabled={loading || rows.length === 0}
                      className="text-sm flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      خروجی Excel
                    </button>

                    <div className="flex rounded-lg bg-neutral-100 p-1">
                      {[
                        { key: "treemap", label: "نقشه درختی" },
                        { key: "bar", label: "ستونی" },
                        { key: "pie", label: "دایره‌ای" },
                        { key: "line", label: "خطی" },
                        { key: "area", label: "ناحیه‌ای" },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setChartType(key as ChartType)}
                          className={`text-sm rounded-md px-3 py-1 font-medium transition-colors ${
                            chartType === key
                              ? "bg-white text-pink-600 shadow-sm"
                              : "text-neutral-600 hover:text-neutral-900"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <ProductSalesChart
                  rows={rows}
                  chartType={chartType}
                  showTop={showTop}
                />
              </div>

              {/* Top Products Table */}
              {rows.length > 0 && (
                <div>
                  <h3 className="text-lg mb-4 font-medium text-neutral-700">
                    محصولات پرفروش
                  </h3>

                  <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
                    <table className="w-full">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-right font-semibold text-neutral-700">
                            رتبه
                          </th>
                          <th className="px-4 py-3 text-right font-semibold text-neutral-700">
                            محصول
                          </th>
                          <th className="px-4 py-3 text-right font-semibold text-neutral-700">
                            درآمد
                          </th>
                          <th className="px-4 py-3 text-right font-semibold text-neutral-700">
                            تعداد
                          </th>
                          <th className="px-4 py-3 text-right font-semibold text-neutral-700">
                            قیمت متوسط
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows
                          .slice(0, Math.min(showTop, 20))
                          .map((product, index) => (
                            <tr
                              key={index}
                              className="border-b border-neutral-100 transition-colors hover:bg-neutral-50"
                            >
                              <td className="px-4 py-3">
                                <span className="font-semibold text-neutral-700">
                                  #{faNum(index + 1)}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-medium text-neutral-900">
                                {product.productTitle}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-blue-600">
                                {faNum(product.totalRevenue)} تومان
                              </td>
                              <td className="px-4 py-3 text-right text-neutral-700">
                                {faNum(product.totalCount)} عدد
                              </td>
                              <td className="px-4 py-3 text-right text-neutral-700">
                                {faNum(
                                  Math.round(
                                    product.totalRevenue / product.totalCount,
                                  ),
                                )}{" "}
                                تومان
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ContentWrapper>
  );
}

function ProductSalesChart({
  rows,
  chartType,
  showTop,
}: {
  rows: Array<{
    productTitle: string;
    totalRevenue: number;
    totalCount: number;
  }>;
  chartType: ChartType;
  showTop: number;
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

  // Prepare data
  const data = rows
    .slice(0, showTop)
    .map((row, index) => ({
      name: row.productTitle,
      display:
        row.productTitle.length > 18
          ? row.productTitle.slice(0, 18) + "…"
          : row.productTitle,
      shortName:
        row.productTitle.length > 15
          ? row.productTitle.slice(0, 15) + "…"
          : row.productTitle,
      revenue: Number(row.totalRevenue),
      count: Number(row.totalCount),
      rank: index + 1,
    }))
    .filter((d) => Number.isFinite(d.revenue) && d.revenue > 0);

  const colors = [
    "#6366F1",
    "#8B5CF6",
    "#06B6D4",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#EC4899",
    "#84CC16",
    "#F97316",
    "#3B82F6",
    "#14B8A6",
    "#F43F5E",
    "#A855F7",
    "#22D3EE",
    "#65A30D",
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

  const commonProps = {
    data: data,
    margin: { top: 20, right: 30, left: 20, bottom: 60 },
  };

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="shortName"
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={11}
              stroke="#64748b"
            />
            <YAxis stroke="#64748b" fontSize={11} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        );

      case "pie":
        return (
          <PieChart width={800} height={450}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props) => {
                const percent = props.percent ?? 0;
                return percent > 3
                  ? `${props.display} (${(percent * 100).toFixed(0)}%)`
                  : "";
              }}
              outerRadius={140}
              fill="#8884d8"
              dataKey="revenue"
              stroke="#fff"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomTooltip />} />
          </PieChart>
        );

      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="shortName"
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={11}
              stroke="#64748b"
            />
            <YAxis stroke="#64748b" fontSize={11} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#6366F1"
              strokeWidth={4}
              dot={{ fill: "#6366F1", strokeWidth: 2, r: 6 }}
              activeDot={{
                r: 10,
                stroke: "#6366F1",
                strokeWidth: 3,
                fill: "#fff",
              }}
            />
          </LineChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="shortName"
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={11}
              stroke="#64748b"
            />
            <YAxis stroke="#64748b" fontSize={11} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#6366F1"
              strokeWidth={3}
              fill="#6366F1"
              fillOpacity={0.1}
            />
          </AreaChart>
        );

      case "treemap":
      default:
        return (
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
        );
    }
  };

  return (
    <div className="w-full" dir="rtl">
      <div className="rounded-xl border border-neutral-200 bg-white p-2 md:p-4">
        <div className="h-[500px] md:h-[600px]" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart info */}
      <div
        className="text-sm mt-4 flex flex-col justify-between gap-2 text-neutral-600 md:flex-row md:items-center"
        dir="rtl"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            <span>محصولات برتر</span>
          </div>
        </div>
        <div className="text-xs text-neutral-500">
          نمایش {faNum(Math.min(rows.length, showTop))} محصول از{" "}
          {faNum(rows.length)} محصول
        </div>
      </div>
    </div>
  );
}
