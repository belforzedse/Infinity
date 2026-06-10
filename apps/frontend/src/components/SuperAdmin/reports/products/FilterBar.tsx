"use client";

import { useEffect, useState } from "react";
import { DatePicker } from "zaman";
import { useDebouncedCallback } from "use-debounce";
import { useReportFilters } from "./useReportFilters";
import { getAllCategories } from "@/services/super-admin/product/category/getAll";

const DAY_MS = 86_400_000;
function toDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function normalizeDate(d: any, fallback: string): string {
  if (d instanceof Date) return toDateOnly(d);
  if (d && d.value instanceof Date) return toDateOnly(d.value);
  const nd = new Date(d);
  return isNaN(nd.getTime()) ? fallback : toDateOnly(nd);
}

const PRESETS: Array<{ label: string; days: number }> = [
  { label: "۷ روز", days: 7 },
  { label: "۳۰ روز", days: 30 },
  { label: "۹۰ روز", days: 90 },
];

const inputCls =
  "h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-transparent focus:ring-2 focus:ring-infinity-primary";

export default function FilterBar({ showProductFilters }: { showProductFilters?: boolean }) {
  const f = useReportFilters();
  const [categories, setCategories] = useState<Array<{ id: number; title: string }>>([]);
  const [search, setSearch] = useState(f.q);

  const debounced = useDebouncedCallback((v: string) => f.setQ(v), 500);

  useEffect(() => {
    getAllCategories()
      .then((res) => {
        const list = (res?.data || []).map((c: any) => ({
          id: c.id,
          title: c.attributes?.Title || `#${c.id}`,
        }));
        setCategories(list);
      })
      .catch(() => setCategories([]));
  }, []);

  const applyPreset = (days: number) => {
    f.setStart(toDateOnly(new Date(Date.now() - days * DAY_MS)));
    f.setEnd(toDateOnly(new Date()));
  };

  return (
    <div className="rounded-2xl bg-white p-4" dir="rtl">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-600">از تاریخ</label>
            <DatePicker
              inputClass={inputCls}
              defaultValue={new Date(f.start)}
              onChange={(d: any) => f.setStart(normalizeDate(d, f.start))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-600">تا تاریخ</label>
            <DatePicker
              inputClass={inputCls}
              defaultValue={new Date(f.end)}
              onChange={(d: any) => f.setEnd(normalizeDate(d, f.end))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-600">بازه‌های سریع</label>
            <div className="flex gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.days}
                  onClick={() => applyPreset(p.days)}
                  className="h-10 flex-1 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {showProductFilters && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-600">جستجوی نام / SKU</label>
              <input
                className={inputCls}
                value={search}
                placeholder="نام محصول یا کد..."
                onChange={(e) => {
                  setSearch(e.target.value);
                  debounced(e.target.value);
                }}
                inputMode="search"
              />
            </div>
          )}
        </div>

        {showProductFilters && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-600">دسته‌بندی</label>
              <select className={inputCls} value={f.cat} onChange={(e) => f.setCat(e.target.value)}>
                <option value="">همه دسته‌ها</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-600">نوع محصول</label>
              <select
                className={inputCls}
                value={f.ptype}
                onChange={(e) => f.setPtype(e.target.value)}
              >
                <option value="">همه</option>
                <option value="Variable">متغیر</option>
                <option value="Simple">ساده</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-600">وضعیت موجودی</label>
              <select
                className={inputCls}
                value={f.stock}
                onChange={(e) => f.setStock(e.target.value)}
              >
                <option value="">همه</option>
                <option value="in">موجود</option>
                <option value="low">کم</option>
                <option value="out">ناموجود</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
