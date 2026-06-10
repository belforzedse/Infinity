"use client";

import { useEffect, useState } from "react";
import KpiCard from "./KpiCard";
import { useReportFilters } from "./useReportFilters";
import { faNum } from "@/utils/faNum";
import { getProductOverview, type ProductOverview } from "@/services/super-admin/reports/products";

export default function OverviewTab() {
  const { start, end } = useReportFilters();
  const [data, setData] = useState<ProductOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getProductOverview({ start, end })
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
          className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  const k = data?.kpis;
  const inv = data?.inventory;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="فروش ناخالص محصولات"
          delta={k?.gross}
          format="toman"
          loading={loading}
          tooltip="مجموع قیمت اقلام فروخته‌شده (بدون حمل و مالیات)"
        />
        <KpiCard
          title="خالص فروش"
          delta={k?.net}
          format="toman"
          loading={loading}
          estimate
          tooltip="ناخالص منهای تخفیف و مرجوعی (تسهیم‌شده)"
        />
        <KpiCard title="تعداد فروش" delta={k?.units} format="count" loading={loading} />
        <KpiCard
          title="سفارش‌های پرداخت‌شده"
          delta={k?.orders}
          format="count"
          loading={loading}
          tooltip="سفارش‌هایی با تسویه موفق در بازه"
        />
        <KpiCard title="قیمت میانگین فروش" delta={k?.avgPrice} format="toman" loading={loading} />
        <KpiCard
          title="میانگین ارزش سفارش"
          delta={k?.aov}
          format="toman"
          loading={loading}
          tooltip="بر مبنای فروش ناخالص محصولات"
        />
        <KpiCard
          title="تخفیف‌ها"
          delta={k?.discounts}
          format="toman"
          loading={loading}
          tooltip="تخفیف در سطح سفارش"
        />
        <KpiCard
          title="مرجوعی‌ها"
          delta={k?.refunds}
          format="toman"
          loading={loading}
          estimate
          tooltip="تراکنش‌های بازگشتی موفق"
        />
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium text-neutral-700">وضعیت موجودی</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <InvBox label="محصولات فعال" value={inv?.activeProducts} loading={loading} />
          <InvBox label="کل تنوع‌ها" value={inv?.totalVariations} loading={loading} />
          <InvBox label="موجود" value={inv?.inStock} loading={loading} tone="green" />
          <InvBox
            label={`کم‌موجود (≤${faNum(data?.lowStockThreshold ?? 5)})`}
            value={inv?.lowStock}
            loading={loading}
            tone="amber"
          />
          <InvBox label="ناموجود" value={inv?.outStock} loading={loading} tone="red" />
        </div>
      </div>

      {!loading && data && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-700">
          {data.notes?.net} {data.notes?.refunds} ارقام به تومان و بر مبنای «سفارش‌های پرداخت‌شده،
          خالص از مرجوعی» محاسبه شده‌اند.
        </p>
      )}
    </div>
  );
}

function InvBox({
  label,
  value,
  loading,
  tone = "neutral",
}: {
  label: string;
  value?: number;
  loading?: boolean;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const toneCls = {
    neutral: "text-neutral-800",
    green: "text-green-600",
    amber: "text-amber-600",
    red: "text-red-600",
  }[tone];
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-4">
      <p className="mb-2 text-xs text-neutral-500">{label}</p>
      {loading ? (
        <div className="h-6 w-12 animate-pulse rounded bg-neutral-100" />
      ) : (
        <p className={`text-xl font-bold ${toneCls}`}>{faNum(value ?? 0)}</p>
      )}
    </div>
  );
}
