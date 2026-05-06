// src/components/SuperAdmin/Reports/AreaLineChart.tsx
"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false },
);
const LineChart = dynamic(() => import("recharts").then((mod) => mod.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), {
  ssr: false,
});
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), {
  ssr: false,
});
const Area = dynamic(() => import("recharts").then((mod) => mod.Area), {
  ssr: false,
});

type Props = {
  data: any[];
  xKey: string;
  yKey: string;
  height?: number;
  color?: string; // hex
  valueFormatter?: (v: number) => string;
};

export default function AreaLineChart({
  data,
  xKey,
  yKey,
  height = 320,
  color = "#ec4899", // pink-500
  valueFormatter = (v) => v.toLocaleString("fa-IR"),
}: Props) {
  const id = React.useId();
  const gradId = `grad-${id}`;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke="#eef2f7" />
          <XAxis
            dataKey={xKey}
            tickMargin={8}
            tick={{ fill: "#9aa4b2", fontSize: 12 }}
            axisLine={false}
          />
          <YAxis
            width={48}
            tickMargin={8}
            tick={{ fill: "#9aa4b2", fontSize: 12 }}
            axisLine={false}
          />
          <Tooltip
            cursor={{ stroke: color, strokeOpacity: 0.15, strokeWidth: 24 }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #f1f5f9",
              boxShadow: "0 8px 24px rgba(0,0,0,.06)",
              direction: "rtl",
            }}
            formatter={(v) => [valueFormatter(Number(v))]}
            labelFormatter={(l) => String(l)}
          />
          <Area type="monotone" dataKey={yKey} stroke="none" fill={`url(#${gradId})`} />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, stroke: color, fill: "#fff" }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: color, fill: "#fff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
