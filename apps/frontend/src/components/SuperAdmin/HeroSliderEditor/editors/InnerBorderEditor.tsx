"use client";

import {
  HERO_INNER_BORDER_OFFSET_MAX_PX,
  HERO_INNER_BORDER_OFFSET_MIN_PX,
  HERO_INNER_BORDER_WIDTH_MAX_PX,
  HERO_INNER_BORDER_WIDTH_MIN_PX,
  type HeroInnerBorder,
} from "@/types/super-admin/heroSlider";
import { resolveColorForInput } from "../utils";
import { SizeRangeControl } from "./SizeRangeControl";

type InnerBorderEditorProps = {
  value: HeroInnerBorder;
  onChange: (next: HeroInnerBorder) => void;
  disabledHint?: string;
};

export function InnerBorderEditor({ value, onChange, disabledHint }: InnerBorderEditorProps) {
  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
        <span>نمایش کادر داخلی</span>
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(event) => onChange({ ...value, enabled: event.target.checked })}
          className="h-4 w-4"
        />
      </label>

      {disabledHint ? <p className="text-[11px] leading-5 text-slate-500">{disabledHint}</p> : null}

      <label className="text-xs text-slate-600">
        رنگ کادر
        <input
          type="color"
          value={resolveColorForInput(value.color, "#ffffff")}
          onChange={(event) => onChange({ ...value, color: event.target.value })}
          className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white"
        />
      </label>

      <SizeRangeControl
        label="ضخامت کادر"
        value={value.widthPx}
        min={HERO_INNER_BORDER_WIDTH_MIN_PX}
        max={HERO_INNER_BORDER_WIDTH_MAX_PX}
        step={1}
        unit="px"
        onChange={(widthPx) => onChange({ ...value, widthPx })}
      />

      <SizeRangeControl
        label="فاصله از لبه"
        value={value.offsetPx}
        min={HERO_INNER_BORDER_OFFSET_MIN_PX}
        max={HERO_INNER_BORDER_OFFSET_MAX_PX}
        step={1}
        unit="px"
        onChange={(offsetPx) => onChange({ ...value, offsetPx })}
      />
    </div>
  );
}

