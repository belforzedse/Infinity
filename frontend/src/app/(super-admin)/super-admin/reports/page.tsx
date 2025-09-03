// src/app/(super-admin)/super-admin/reports/page.tsx
"use client";

import * as React from "react";
import clsx from "clsx";
import AreaLineChart from "@/components/SuperAdmin/Reports/AreaLineChart";
import { faNum } from "@/utils/faNum";

const months = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

function gen(seed = 1) {
  let x = seed;
  return () => (x = (x * 16807) % 2147483647) % 230;
}

const randA = gen(7);
const randB = gen(19);

const salesCountData = months.map((m) => ({ ماه: m, مقدار: randA() }));
const salesSumData = months.map((m) => ({
  ماه: m,
  مقدار: randB() * 1_000_000,
}));

export default function ReportsPage() {
  const [period, setPeriod] = React.useState<"ماهانه" | "هفتگی" | "روزانه">(
    "ماهانه",
  );
  const [product, setProduct] = React.useState("محصول خاصی");
  const [gateway, setGateway] = React.useState("درگاه پرداخت");
  const [shipping, setShipping] = React.useState("روش های حمل و نقل");

  return (
    <div className="space-y-8 px-6 py-6" dir="rtl">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">گزارش ها</h1>
        <nav className="text-sm space-x-2 space-x-reverse text-slate-500">
          <span className="font-medium text-pink-500">کلی</span>
          <span className="mx-2">/</span>
          <span>جزئی</span>
          <span className="mx-2">/</span>
          <span>کاربران</span>
        </nav>
      </header>

      {/* Card 1 */}
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
            >
              {["ماهانه", "هفتگی", "روزانه"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
            <Select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            >
              {["محصول خاصی", "همه محصولات"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
            <Select
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
            >
              {["درگاه پرداخت", "ملت", " سامان "].map((x) => (
                <option key={x.trim() || x}>{x}</option>
              ))}
            </Select>
            <Select
              value={shipping}
              onChange={(e) => setShipping(e.target.value)}
            >
              {["روش های حمل و نقل", "تیپاکس", "پست"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-sm">بازه زمانی</span>
            <button className="text-sm h-9 rounded-lg border border-slate-200 px-3 hover:bg-slate-50">
              انتخاب
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              تعداد فروش کل
            </h2>
          </div>
          <AreaLineChart data={salesCountData} xKey="ماه" yKey="مقدار" />
        </div>
      </section>

      {/* Card 2 */}
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
            >
              {["ماهانه", "هفتگی", "روزانه"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
            <Select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            >
              {["محصول خاصی", "همه محصولات"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
            <Select
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
            >
              {["درگاه پرداخت", "ملت", " سامان "].map((x) => (
                <option key={x.trim() || x}>{x}</option>
              ))}
            </Select>
            <Select
              value={shipping}
              onChange={(e) => setShipping(e.target.value)}
            >
              {["روش های حمل و نقل", "تیپاکس", "پست"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-sm">بازه زمانی</span>
            <button className="text-sm h-9 rounded-lg border border-slate-200 px-3 hover:bg-slate-50">
              انتخاب
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              مجموع فروش کل
            </h2>
          </div>
          <AreaLineChart
            data={salesSumData}
            xKey="ماه"
            yKey="مقدار"
            valueFormatter={(v) => `${faNum(v)} تومان`}
          />
        </div>
      </section>
    </div>
  );
}

function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "text-sm h-9 rounded-lg border border-slate-200 bg-white px-3 text-slate-700",
        "focus:outline-none focus:ring-2 focus:ring-pink-500/40",
        className,
      )}
      {...props}
    />
  );
}
