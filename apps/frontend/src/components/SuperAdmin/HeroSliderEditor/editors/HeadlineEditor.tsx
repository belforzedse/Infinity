"use client";

import { HERO_HEADLINE_STYLE_PRESETS } from "@/types/super-admin/heroSliderPackages";
import type { HeroHeadlineSlot, HeroSlotConfig } from "@/types/super-admin/heroSlider";
import { resolveColorForInput } from "../utils";
import { TextStyleEditor } from "./TextStyleEditor";

type HeadlineEditorProps = {
  slot: HeroHeadlineSlot;
  onChange: (next: HeroSlotConfig) => void;
};

export function HeadlineEditor({ slot, onChange }: HeadlineEditorProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs text-slate-600">
        پکیج استایل
        <select
          value=""
          onChange={(event) => {
            const id = event.target.value;
            if (!id) return;
            const preset = HERO_HEADLINE_STYLE_PRESETS.find((p) => p.id === id);
            if (!preset) return;
            onChange({
              ...slot,
              titleStyle: { ...slot.titleStyle, ...preset.titleStyle },
              subtitleStyle: { ...slot.subtitleStyle, ...preset.subtitleStyle },
            });
            event.target.value = "";
          }}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">اعمال پکیج...</option>
          {HERO_HEADLINE_STYLE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-xs text-slate-600">
        تیتر
        <input
          type="text"
          value={slot.title}
          onChange={(event) => onChange({ ...slot, title: event.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-xs text-slate-600">
        زیرتیتر
        <textarea
          rows={2}
          value={slot.subtitle}
          onChange={(event) => onChange({ ...slot, subtitle: event.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-xs text-slate-600">
        رنگ پس‌زمینه
        <input
          type="color"
          value={resolveColorForInput(slot.backgroundColor, "#f1f5f9")}
          onChange={(event) => onChange({ ...slot, backgroundColor: event.target.value })}
          className="mt-1 h-10 w-full rounded-lg border border-slate-200"
        />
      </label>

      <label className="text-xs text-slate-600">
        فاصله پایین بلاک تیتر (px)
        <input
          type="number"
          min={0}
          max={160}
          step={2}
          value={slot.bottomMarginPx}
          onChange={(event) =>
            onChange({
              ...slot,
              bottomMarginPx: Math.min(160, Math.max(0, Number(event.target.value) || 0)),
            })
          }
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      <TextStyleEditor
        label="استایل تیتر"
        value={slot.titleStyle}
        onChange={(titleStyle) => onChange({ ...slot, titleStyle })}
      />

      <TextStyleEditor
        label="استایل زیرتیتر"
        value={slot.subtitleStyle}
        onChange={(subtitleStyle) => onChange({ ...slot, subtitleStyle })}
      />
    </div>
  );
}
