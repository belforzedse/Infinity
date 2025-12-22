"use client";

type StatCardProps = {
  title: string;
  value: string;
  trendLabel?: string;
  trendTone?: "positive" | "negative" | "neutral";
  highlight?: boolean;
};

export function StatCard({
  title,
  value,
  trendLabel,
  trendTone = "neutral",
  highlight = false,
}: StatCardProps) {
  const trendColor =
    trendTone === "positive"
      ? "text-emerald-600"
      : trendTone === "negative"
      ? "text-rose-600"
      : "text-neutral-500";

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm transition-all ${
        highlight ? "border-pink-200 bg-white" : "border-neutral-100 bg-white"
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
