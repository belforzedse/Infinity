"use client";

import {
  HERO_BACKGROUND_POSITION_PRESETS,
  HERO_BACKGROUND_SIZE_PRESETS,
  type HeroCardSlot,
  type HeroSlotConfig,
} from "@/types/super-admin/heroSlider";
import { SlotTextField } from "./SlotTextField";

interface BackgroundSettingsProps {
  slot: HeroCardSlot;
  onChange: (next: HeroSlotConfig) => void;
}

export function BackgroundSettings({ slot, onChange }: BackgroundSettingsProps) {
  return (
    <>
      <label className="text-xs text-slate-600">
        نوع پس‌زمینه
        <select
          value={slot.backgroundType}
          onChange={(event) =>
            onChange({
              ...slot,
              backgroundType: event.target.value === "image" ? "image" : "color",
            })
          }
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="color">رنگ</option>
          <option value="image">تصویر</option>
        </select>
      </label>
      <SlotTextField
        label="تصویر پس‌زمینه"
        value={slot.backgroundImageUrl}
        onChange={(value) => onChange({ ...slot, backgroundImageUrl: value })}
      />
      <SlotTextField
        label="عرض پس‌زمینه"
        value={slot.backgroundWidth}
        onChange={(value) => onChange({ ...slot, backgroundWidth: value })}
      />
      <SlotTextField
        label="ارتفاع پس‌زمینه"
        value={slot.backgroundHeight}
        onChange={(value) => onChange({ ...slot, backgroundHeight: value })}
      />
      <label className="text-xs text-slate-600">
        اندازه پس‌زمینه (پیش‌تنظیم)
        <select
          value={
            HERO_BACKGROUND_SIZE_PRESETS.some((p) => p.value === slot.backgroundSize)
              ? slot.backgroundSize
              : ""
          }
          onChange={(event) => {
            const v = event.target.value;
            if (v) onChange({ ...slot, backgroundSize: v });
          }}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">سفارشی</option>
          {HERO_BACKGROUND_SIZE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-slate-600">
        موقعیت پس‌زمینه (پیش‌تنظیم)
        <select
          value={
            HERO_BACKGROUND_POSITION_PRESETS.some((p) => p.value === slot.backgroundPosition)
              ? slot.backgroundPosition
              : ""
          }
          onChange={(event) => {
            const v = event.target.value;
            if (v) onChange({ ...slot, backgroundPosition: v });
          }}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">سفارشی</option>
          {HERO_BACKGROUND_POSITION_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <SlotTextField
        label="موقعیت پس‌زمینه"
        value={slot.backgroundPosition}
        onChange={(value) => onChange({ ...slot, backgroundPosition: value })}
      />
      <SlotTextField
        label="اندازه پس‌زمینه"
        value={slot.backgroundSize}
        onChange={(value) => onChange({ ...slot, backgroundSize: value })}
      />
      <SlotTextField
        label="کلاس پس‌زمینه"
        value={slot.backgroundClassName}
        onChange={(value) => onChange({ ...slot, backgroundClassName: value })}
      />
    </>
  );
}
