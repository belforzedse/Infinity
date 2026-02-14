"use client";

import { useState } from "react";
import ImageUploadField from "@/components/SuperAdmin/UpsertPage/ContentWrapper/Fields/ImageUploadField";
import {
  HERO_BACKGROUND_POSITION_PRESETS,
  HERO_BACKGROUND_SIZE_PRESETS,
  type HeroMainVisualSlot,
  type HeroSlotConfig,
} from "@/types/super-admin/heroSlider";
import { resolveColorForInput } from "../utils";

type MainVisualEditorProps = {
  slot: HeroMainVisualSlot;
  onChange: (next: HeroSlotConfig) => void;
};

export function MainVisualEditor({ slot, onChange }: MainVisualEditorProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="space-y-3">
      <label className="text-xs text-slate-600">
        رنگ پس‌زمینه
        <input
          type="color"
          value={resolveColorForInput(slot.backgroundColor, "#f8fafc")}
          onChange={(event) => onChange({ ...slot, backgroundColor: event.target.value })}
          className="mt-1 h-10 w-full rounded-lg border border-slate-200"
        />
      </label>

      <div>
        <p className="mb-1 text-xs text-slate-600">تصویر پس‌زمینه</p>
        <ImageUploadField
          value={slot.backgroundImageUrl}
          onChange={(value) => onChange({ ...slot, backgroundImageUrl: value })}
        />
      </div>

      <div>
        <p className="mb-1 text-xs text-slate-600">تصویر اصلی</p>
        <ImageUploadField
          value={slot.foregroundImageUrl}
          onChange={(value) => onChange({ ...slot, foregroundImageUrl: value })}
        />
      </div>

      <label className="text-xs text-slate-600">
        متن جایگزین تصویر
        <input
          type="text"
          value={slot.foregroundAlt}
          onChange={(event) => onChange({ ...slot, foregroundAlt: event.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-xs text-slate-600">
        بزرگنمایی تصویر اصلی (۰.۵ تا ۲)
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.1}
          value={slot.foregroundZoom ?? 1}
          onChange={(event) =>
            onChange({
              ...slot,
              foregroundZoom: Math.min(2, Math.max(0.5, Number(event.target.value) || 1)),
            })
          }
          className="mt-1 w-full"
        />
        <span className="text-[11px] text-slate-500">
          {(slot.foregroundZoom ?? 1).toFixed(1)}
        </span>
      </label>

      <label className="text-xs text-slate-600">
        اندازه پس‌زمینه
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
        موقعیت پس‌زمینه
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

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
        <button
          type="button"
          onClick={() => setAdvancedOpen((prev) => !prev)}
          className="text-xs text-slate-600 underline"
        >
          {advancedOpen ? "بستن تنظیمات پیشرفته" : "تنظیمات پیشرفته تصویر و بک‌گراند"}
        </button>

        {advancedOpen ? (
          <div className="mt-2 grid grid-cols-1 gap-2">
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
            <label className="text-xs text-slate-600">
              عرض پس‌زمینه
              <input
                type="text"
                value={slot.backgroundWidth}
                onChange={(event) => onChange({ ...slot, backgroundWidth: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              ارتفاع پس‌زمینه
              <input
                type="text"
                value={slot.backgroundHeight}
                onChange={(event) => onChange({ ...slot, backgroundHeight: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              موقعیت پس‌زمینه
              <input
                type="text"
                value={slot.backgroundPosition}
                onChange={(event) => onChange({ ...slot, backgroundPosition: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              اندازه پس‌زمینه
              <input
                type="text"
                value={slot.backgroundSize}
                onChange={(event) => onChange({ ...slot, backgroundSize: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              کلاس پس‌زمینه
              <input
                type="text"
                value={slot.backgroundClassName}
                onChange={(event) => onChange({ ...slot, backgroundClassName: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              کلاس تصویر اصلی
              <input
                type="text"
                value={slot.foregroundClassName}
                onChange={(event) => onChange({ ...slot, foregroundClassName: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              موقعیت تصویر اصلی
              <input
                type="text"
                value={slot.foregroundObjectPosition}
                onChange={(event) =>
                  onChange({ ...slot, foregroundObjectPosition: event.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              عرض تصویر اصلی
              <input
                type="text"
                value={slot.foregroundCustomWidth}
                onChange={(event) => onChange({ ...slot, foregroundCustomWidth: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              ارتفاع تصویر اصلی
              <input
                type="text"
                value={slot.foregroundCustomHeight}
                onChange={(event) => onChange({ ...slot, foregroundCustomHeight: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
        ) : null}
      </div>
    </div>
  );
}
