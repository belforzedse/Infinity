"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/services";

export type SelectedDelivery = {
  id: number;
  title: string;
};

type ShippingMethod = {
  id: number;
  attributes?: {
    Title: string;
    Price?: number;
  };
};

interface DeliverySelectorProps {
  selected: SelectedDelivery[];
  onToggle: (delivery: SelectedDelivery) => void;
}

export default function CouponDeliverySelector({ selected, onToggle }: DeliverySelectorProps) {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await apiClient.get("/shippings?pagination[pageSize]=100");
        if (!mounted) return;
        setMethods(((res as any).data || []) as ShippingMethod[]);
      } catch (error) {
        console.error("Failed to load shipping methods", error);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredMethods = methods.filter((method) => {
    const title = method.attributes?.Title || "";
    return title.toLowerCase().includes(search.toLowerCase());
  });

  const isSelected = (id: number) => selected.some((d) => d.id === id);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-neutral-800">روش‌های ارسال مجاز</p>
          <p className="text-sm text-neutral-500">در صورت انتخاب، کد تخفیف فقط برای روش‌های انتخابی فعال می‌شود</p>
        </div>
        {selected.length > 0 && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
            {selected.length} روش انتخاب شده
          </span>
        )}
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="جستجو در روش‌های ارسال..."
        className="w-full rounded-xl border border-neutral-200 px-4 py-2 text-sm text-neutral-700 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
      />

      <div className="mt-3 max-h-60 overflow-y-auto rounded-xl border border-neutral-100">
        {filteredMethods.map((method) => {
          const id = method.id;
          const title = method.attributes?.Title || `روش ارسال ${id}`;
          const active = isSelected(id);
          return (
            <label
              key={id}
              className={`flex cursor-pointer items-center justify-between border-b border-neutral-100 px-3 py-2 text-sm last:border-b-0 ${
                active ? "bg-pink-50 text-pink-600" : "bg-white text-neutral-700"
              }`}
            >
              <span>{title}</span>
              <input
                type="checkbox"
                checked={active}
                onChange={() => onToggle({ id, title })}
              />
            </label>
          );
        })}
        {filteredMethods.length === 0 && (
          <div className="px-3 py-4 text-center text-sm text-neutral-500">
            موردی یافت نشد
          </div>
        )}
      </div>
    </div>
  );
}
