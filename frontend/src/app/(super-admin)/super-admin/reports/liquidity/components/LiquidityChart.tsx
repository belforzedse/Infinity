"use client";

import dynamic from "next/dynamic";
import { faNum } from "@/utils/faNum";

const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), {
  ssr: false,
});
const Line = dynamic(() => import("recharts").then((m) => m.Line), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), {
  ssr: false,
});
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), {
  ssr: false,
});
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  {
    ssr: false,
  },
);

type LiquidityChartProps = {
  series: Array<{ bucket: string; total: number }>;
};

type ChartPoint = {
  date: string;
  fullDate: string;
  total: number;
  bucket: string;
};

type TooltipPayloadEntry = {
  payload: ChartPoint;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
};

export function LiquidityChart({ series }: LiquidityChartProps) {
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
        <p className="text-xs mt-1 text-neutral-400">لطفاً بازه زمانی دیگری انتخاب کنید</p>
      </div>
    );
  }

  const chartData: ChartPoint[] = series.map((item) => ({
    date: new Date(item.bucket).toLocaleDateString("fa-IR", {
      month: "short",
      day: "numeric",
      year: series.length > 30 ? undefined : "numeric",
    }),
    fullDate: new Date(item.bucket).toLocaleDateString("fa-IR"),
    total: Number(item.total),
    bucket: item.bucket,
  }));

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-lg" dir="rtl">
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
        <div className="h-[400px]" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} interval="preserveStartEnd" />
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
                <linearGradient id="liquidityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="text-sm mt-4 flex items-center justify-between text-neutral-600" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-pink-500"></div>
          <span>روند نقدینگی</span>
        </div>
        <div className="text-xs text-neutral-500">{series.length} نقطه داده</div>
      </div>
    </div>
  );
}
