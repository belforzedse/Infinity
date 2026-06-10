"use client";

import { faNum } from "@/utils/faNum";
import { priceFormatter } from "@/utils/price";
import type { Delta } from "@/services/super-admin/reports/products";

type Format = "toman" | "count";

function fmt(value: number, format: Format) {
  return format === "toman"
    ? priceFormatter(Math.round(value), " تومان")
    : faNum(Math.round(value));
}

export default function KpiCard({
  title,
  delta,
  format,
  tooltip,
  estimate,
  loading,
}: {
  title: string;
  delta?: Delta;
  format: Format;
  tooltip?: string;
  estimate?: boolean;
  loading?: boolean;
}) {
  if (loading || !delta) {
    return (
      <div className="rounded-2xl border border-neutral-100 bg-white p-5">
        <div className="mb-3 h-4 w-24 animate-pulse rounded bg-neutral-100" />
        <div className="h-7 w-32 animate-pulse rounded bg-neutral-100" />
        <div className="mt-3 h-4 w-20 animate-pulse rounded bg-neutral-100" />
      </div>
    );
  }

  const up = delta.change > 0;
  const down = delta.change < 0;
  const changeColor = up ? "text-green-600" : down ? "text-red-600" : "text-neutral-400";
  const arrow = up ? "↑" : down ? "↓" : "•";

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5" dir="rtl">
      <div className="mb-2 flex items-center gap-1.5">
        <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
        {estimate && (
          <span
            className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600"
            title="این مقدار تخمینی است (تسهیم در سطح قلم)"
          >
            تخمینی
          </span>
        )}
        {tooltip && (
          <span
            className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-neutral-100 text-[10px] text-neutral-500"
            title={tooltip}
          >
            ؟
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-neutral-800">{fmt(delta.current, format)}</p>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className={`font-medium ${changeColor}`}>
          {arrow} {delta.changePct === null ? "—" : `${faNum(Math.abs(delta.changePct))}٪`}
        </span>
        <span className="text-neutral-400">دوره قبل: {fmt(delta.previous, format)}</span>
      </div>
    </div>
  );
}
