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
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { LiquidityChart } from "@/app/(super-admin)/super-admin/reports/liquidity/components/LiquidityChart";
import { StatCard } from "@/app/(super-admin)/super-admin/reports/liquidity/components/StatCard";

export default function LiquidityReportPage() {
  const router = useRouter();
  const { roleName, isLoading } = useCurrentUser();
  const normalizedRole = (roleName ?? "").toLowerCase().trim();
  const [start, setStart] = useState<Date>(new Date(Date.now() - 30 * 86400000));
  const [end, setEnd] = useState<Date>(new Date());
  const [interval, setInterval] = useState<LiquidityInterval>("day");
  const [activePreset, setActivePreset] = useState<number | null>(null);
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
    if (!isLoading && normalizedRole !== "superadmin") {
      router.replace("/super-admin");
    }
  }, [isLoading, normalizedRole, router]);

  useEffect(() => {
    if (isLoading || normalizedRole !== "superadmin") {
      return;
    }

    setLoading(true);
    getLiquidity({ start: startISO, end: endISO, interval })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [startISO, endISO, interval, isLoading, normalizedRole]);

  if (!isLoading && normalizedRole !== "superadmin") {
    return null;
  }

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
                    setActivePreset(null);
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
                    setActivePreset(null);
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
