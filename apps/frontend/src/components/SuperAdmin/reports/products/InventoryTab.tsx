"use client";

import { useEffect, useState } from "react";
import { useReportFilters } from "./useReportFilters";
import { faNum } from "@/utils/faNum";
import {
  getProductInventory,
  type ProductInventory,
  type InventoryRow,
} from "@/services/super-admin/reports/products";

const SECTIONS: Array<{
  key: keyof ProductInventory;
  title: string;
  hint: string;
  metric: "stock" | "cover" | "sold";
}> = [
  { key: "outOfStock", title: "ناموجود", hint: "موجودی صفر", metric: "stock" },
  { key: "lowStock", title: "کم‌موجود", hint: "زیر آستانه موجودی", metric: "stock" },
  {
    key: "stockNoSales",
    title: "موجود ولی بدون فروش",
    hint: "در بازه فروشی نداشته‌اند",
    metric: "stock",
  },
  { key: "fastMoving", title: "پرفروش (سریع)", hint: "بیشترین تعداد فروش در بازه", metric: "sold" },
  { key: "slowMoving", title: "کندفروش", hint: "بیشترین روز پوشش موجودی", metric: "cover" },
];

export default function InventoryTab() {
  const { start, end } = useReportFilters();
  const [data, setData] = useState<ProductInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getProductInventory({ start, end })
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e?.message || "خطا در دریافت اطلاعات"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [start, end, reloadKey]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center" dir="rtl">
        <p className="mb-4 text-red-600">{error}</p>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs leading-6 text-blue-700">
        «روز پوشش موجودی» بر مبنای سرعت فروش در بازهٔ انتخاب‌شده تخمین زده می‌شود. آستانهٔ
        کم‌موجودی: {faNum(data?.lowStockThreshold ?? 5)} عدد.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {SECTIONS.map((s) => (
          <Section
            key={String(s.key)}
            title={s.title}
            hint={s.hint}
            metric={s.metric}
            rows={(data?.[s.key] as InventoryRow[]) || []}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  rows,
  loading,
  metric,
}: {
  title: string;
  hint: string;
  rows: InventoryRow[];
  loading: boolean;
  metric: "stock" | "cover" | "sold";
}) {
  const metricLabel = metric === "sold" ? "فروش" : metric === "cover" ? "روز پوشش" : "موجودی";
  const metricValue = (r: InventoryRow) =>
    metric === "sold"
      ? faNum(r.unitsSold)
      : metric === "cover"
        ? r.daysOfCover === null
          ? "—"
          : faNum(r.daysOfCover)
        : faNum(r.currentStock);

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-medium text-neutral-700">{title}</h3>
        <span className="text-xs text-neutral-400">{hint}</span>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-neutral-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-400">موردی یافت نشد</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-xs text-neutral-400">
            <tr>
              <th className="px-2 py-1.5 text-right">محصول</th>
              <th className="px-2 py-1.5 text-right">{metricLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.variationId} className="border-t border-neutral-100">
                <td className="px-2 py-2">
                  <span className="block max-w-[260px] truncate text-neutral-700">
                    {r.productTitle}
                  </span>
                  <span className="block font-mono text-xs text-neutral-400">{r.sku}</span>
                </td>
                <td className="px-2 py-2 font-medium text-neutral-800">{metricValue(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
