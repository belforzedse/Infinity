"use client";

import {
  DEFAULT_TITLE_SUBTITLE_GAP_PX,
  MAX_HEADLINE_BOTTOM_MARGIN_PX,
  MAX_TITLE_SUBTITLE_GAP_PX,
  MIN_HEADLINE_BOTTOM_MARGIN_PX,
  MIN_TITLE_SUBTITLE_GAP_PX,
} from "@/types/super-admin/heroSlider";
import { HERO_HEADLINE_STYLE_PRESETS } from "@/types/super-admin/heroSliderPackages";
import type { HeroHeadlineSlot, HeroSlotConfig } from "@/types/super-admin/heroSlider";
import { resolveColorForInput } from "../utils";
import { SizeRangeControl } from "./SizeRangeControl";
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

      <SizeRangeControl
        label="فاصله بین تیتر و زیرتیتر"
        value={slot.titleSubtitleGapPx ?? DEFAULT_TITLE_SUBTITLE_GAP_PX}
        min={MIN_TITLE_SUBTITLE_GAP_PX}
        max={MAX_TITLE_SUBTITLE_GAP_PX}
        step={1}
        unit="px"
        onChange={(titleSubtitleGapPx) => onChange({ ...slot, titleSubtitleGapPx })}
      />

      <SizeRangeControl
        label="فاصله پایین بلاک تیتر"
        value={slot.bottomMarginPx}
        min={MIN_HEADLINE_BOTTOM_MARGIN_PX}
        max={MAX_HEADLINE_BOTTOM_MARGIN_PX}
        step={2}
        unit="px"
        onChange={(bottomMarginPx) => onChange({ ...slot, bottomMarginPx })}
      />

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
