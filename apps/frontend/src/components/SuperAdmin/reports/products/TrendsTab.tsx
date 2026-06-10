"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useReportFilters } from "./useReportFilters";
import { faNum } from "@/utils/faNum";
import { priceFormatter } from "@/utils/price";
import {
  getProductTrends,
  type ProductTrends,
  type TrendGrouping,
} from "@/services/super-admin/reports/products";

const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), {
  ssr: false,
});
const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((m) => m.Area), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), {
  ssr: false,
});
const RTooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });

type Metric = "net" | "gross" | "units" | "orders" | "discounts" | "refunds";

const METRICS: Array<{ key: Metric; label: string; money: boolean }> = [
  { key: "net", label: "خالص فروش", money: true },
  { key: "gross", label: "فروش ناخالص", money: true },
  { key: "units", label: "تعداد فروش", money: false },
  { key: "orders", label: "سفارش‌ها", money: false },
  { key: "discounts", label: "تخفیف‌ها", money: true },
  { key: "refunds", label: "مرجوعی‌ها", money: true },
];

const GROUPINGS: Array<{ key: TrendGrouping; label: string }> = [
  { key: "day", label: "روزانه" },
  { key: "week", label: "هفتگی" },
  { key: "month", label: "ماهانه" },
];

function faDate(s: string) {
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("fa-IR", { month: "short", day: "numeric" });
}

export default function TrendsTab() {
  const { start, end } = useReportFilters();
  const [metric, setMetric] = useState<Metric>("net");
  const [grouping, setGrouping] = useState<TrendGrouping | "">("");
  const [data, setData] = useState<ProductTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getProductTrends({ start, end, grouping: grouping || undefined })
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e?.message || "خطا در دریافت اطلاعات"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [start, end, grouping, reloadKey]);

  const metricMeta = METRICS.find((m) => m.key === metric)!;
  const chartData = useMemo(
    () => (data?.series || []).map((p) => ({ ...p, label: faDate(p.bucket) })),
    [data],
  );

  const Tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const v = payload[0].value as number;
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm shadow" dir="rtl">
        <p className="mb-1 font-medium text-neutral-700">{label}</p>
        <p className="text-infinity-primary">
          {metricMeta.label}: {metricMeta.money ? priceFormatter(v, " تومان") : faNum(v)}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-neutral-600">شاخص:</span>
          <div className="flex flex-wrap gap-1 rounded-lg bg-neutral-100 p-1">
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`rounded-md px-3 py-1 text-sm ${
                  metric === m.key ? "bg-white text-infinity-primary shadow-sm" : "text-neutral-600"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">گروه‌بندی:</span>
          <select
            className="h-9 rounded-lg border border-neutral-300 px-2 text-sm"
            value={grouping}
            onChange={(e) => setGrouping(e.target.value as TrendGrouping | "")}
          >
            <option value="">خودکار</option>
            {GROUPINGS.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4">
        {loading ? (
          <div className="flex h-[420px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-infinity-primary" />
          </div>
        ) : error ? (
          <div className="flex h-[420px] flex-col items-center justify-center gap-3">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
            >
              تلاش مجدد
            </button>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[420px] flex-col items-center justify-center text-center text-neutral-500">
            <p>داده‌ای برای این بازه ثبت نشده است.</p>
            <p className="mt-1 text-xs text-neutral-400">بازه زمانی دیگری انتخاب کنید.</p>
          </div>
        ) : (
          <div className="h-[420px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" fontSize={11} stroke="#64748b" />
                <YAxis fontSize={11} stroke="#64748b" width={70} tickFormatter={(v) => faNum(v)} />
                <RTooltip content={<Tip />} />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke="#6366F1"
                  strokeWidth={2}
                  fill="#6366F1"
                  fillOpacity={0.12}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
