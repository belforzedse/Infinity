"use client";

import { useState } from "react";
import {
  HERO_FONT_FAMILY_OPTIONS,
  HERO_FONT_SIZE_PX_MAX,
  HERO_FONT_SIZE_PX_MIN,
  HERO_FONT_WEIGHT_OPTIONS,
  HERO_LETTER_SPACING_OPTIONS,
  HERO_LINE_HEIGHT_OPTIONS,
  fontSizeTokenToPx,
  pxToFontSizeToken,
  type HeroFontFamilyToken,
  type HeroFontWeightToken,
  type HeroLetterSpacingToken,
  type HeroLineHeightToken,
  type HeroTextStyle,
} from "@/types/super-admin/heroSlider";
import { resolveColorForInput } from "@/components/SuperAdmin/HeroSliderEditor/utils";
import { SizeRangeControl } from "./SizeRangeControl";

type TextStyleEditorProps = {
  label: string;
  value: HeroTextStyle;
  onChange: (next: HeroTextStyle) => void;
};

export function TextStyleEditor({ label, value, onChange }: TextStyleEditorProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        <button
          type="button"
          onClick={() => setAdvancedOpen((prev) => !prev)}
          className="text-[11px] text-slate-500 underline"
        >
          {advancedOpen ? "بستن تنظیمات پیشرفته" : "تنظیمات پیشرفته"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <label className="text-xs text-slate-600">
          رنگ متن
          <input
            type="color"
            value={resolveColorForInput(value.color)}
            onChange={(event) => onChange({ ...value, color: event.target.value })}
            className="mt-1 h-9 w-full rounded-md border border-slate-200"
          />
        </label>

        <label className="text-xs text-slate-600">
          فونت
          <select
            value={value.fontFamily}
            onChange={(event) =>
              onChange({
                ...value,
                fontFamily: event.target.value as HeroFontFamilyToken,
              })
            }
            className="mt-1 w-full rounded-md border border-slate-200 px-2 py-2 text-xs"
          >
            {HERO_FONT_FAMILY_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <SizeRangeControl
          label="اندازه متن"
          value={fontSizeTokenToPx(value.fontSize)}
          min={HERO_FONT_SIZE_PX_MIN}
          max={HERO_FONT_SIZE_PX_MAX}
          step={1}
          unit="px"
          onChange={(px) =>
            onChange({
              ...value,
              fontSize: pxToFontSizeToken(px),
            })
          }
        />
      </div>

      {advancedOpen ? (
        <div className="grid grid-cols-1 gap-2">
          <label className="text-xs text-slate-600">
            وزن فونت
            <select
              value={value.fontWeight}
              onChange={(event) =>
                onChange({
                  ...value,
                  fontWeight: event.target.value as HeroFontWeightToken,
                })
              }
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-2 text-xs"
            >
              {HERO_FONT_WEIGHT_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-slate-600">
            فاصله خطوط
            <select
              value={value.lineHeight}
              onChange={(event) =>
                onChange({
                  ...value,
                  lineHeight: event.target.value as HeroLineHeightToken,
                })
              }
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-2 text-xs"
            >
              {HERO_LINE_HEIGHT_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-slate-600">
            فاصله حروف
            <select
              value={value.letterSpacing}
              onChange={(event) =>
                onChange({
                  ...value,
                  letterSpacing: event.target.value as HeroLetterSpacingToken,
                })
              }
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-2 text-xs"
            >
              {HERO_LETTER_SPACING_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </div>
  );
}
