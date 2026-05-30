"use client";

import type { HeroImageOverflow, HeroOverflowEdge } from "@/types/super-admin/heroSlider";

type OverflowSettingsProps = {
  label: string;
  value: HeroImageOverflow;
  onChange: (next: HeroImageOverflow) => void;
};

const EDGE_OPTIONS: Array<{ value: HeroOverflowEdge; label: string }> = [
  { value: "top", label: "بالا" },
  { value: "right", label: "راست" },
  { value: "bottom", label: "پایین" },
  { value: "left", label: "چپ" },
];

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function OverflowSettings({ label, value, onChange }: OverflowSettingsProps) {
  const update = (patch: Partial<HeroImageOverflow>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <label className="flex items-center justify-between text-xs text-slate-700">
        <span>{label}</span>
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(event) => update({ enabled: event.target.checked })}
          className="h-4 w-4"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-600">
          جهت خروج
          <select
            value={value.edge}
            onChange={(event) => update({ edge: event.target.value as HeroOverflowEdge })}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            disabled={!value.enabled}
          >
            {EDGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-600">
          مقدار خروج (px)
          <input
            type="number"
            min={0}
            max={240}
            value={value.amountPx}
            disabled={!value.enabled}
            onChange={(event) => update({ amountPx: clamp(Number(event.target.value), 0, 240) })}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>

      <label className="block text-xs text-slate-600">
        اندازه تصویر (%)
        <input
          type="range"
          min={20}
          max={220}
          value={value.widthPercent}
          disabled={!value.enabled}
          onChange={(event) => update({ widthPercent: clamp(Number(event.target.value), 20, 220) })}
          className="mt-1 w-full"
        />
        <span className="text-[11px] text-slate-500">{value.widthPercent}%</span>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-600">
          جابه‌جایی افقی (%)
          <input
            type="number"
            min={-100}
            max={200}
            value={value.offsetXPercent}
            disabled={!value.enabled}
            onChange={(event) =>
              update({ offsetXPercent: clamp(Number(event.target.value), -100, 200) })
            }
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs text-slate-600">
          جابه‌جایی عمودی (%)
          <input
            type="number"
            min={-100}
            max={200}
            value={value.offsetYPercent}
            disabled={!value.enabled}
            onChange={(event) =>
              update({ offsetYPercent: clamp(Number(event.target.value), -100, 200) })
            }
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>
    </div>
  );
}
