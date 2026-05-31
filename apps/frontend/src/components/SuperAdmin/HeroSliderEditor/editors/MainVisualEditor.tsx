"use client";

import ImageUploadField from "@/components/SuperAdmin/UpsertPage/ContentWrapper/Fields/ImageUploadField";
import {
  HERO_BACKGROUND_POSITION_PRESETS,
  HERO_BACKGROUND_SCALE_MAX,
  HERO_BACKGROUND_SCALE_MIN,
  HERO_FOREGROUND_HEIGHT_PERCENT_MAX,
  HERO_FOREGROUND_HEIGHT_PERCENT_MIN,
  HERO_FOREGROUND_OFFSET_MAX_PX,
  HERO_FOREGROUND_OFFSET_MIN_PX,
  HERO_FOREGROUND_WIDTH_PERCENT_MAX,
  HERO_FOREGROUND_WIDTH_PERCENT_MIN,
  HERO_FOREGROUND_ZOOM_MAX,
  HERO_FOREGROUND_ZOOM_MIN,
  HERO_OBJECT_POSITION_MAX,
  HERO_OBJECT_POSITION_MIN,
  backgroundSizeToPercent,
  foregroundCustomHeightToPercent,
  foregroundCustomWidthToPercent,
  objectPositionPresetValue,
  objectPositionToPercents,
  percentToBackgroundSize,
  percentToForegroundCustomHeight,
  percentToForegroundCustomWidth,
  percentsToObjectPosition,
  type HeroMainVisualSlot,
  type HeroSlotConfig,
} from "@/types/super-admin/heroSlider";
import { resolveColorForInput } from "../utils";
import { EditorSection } from "./EditorSection";
import { InnerBorderEditor } from "./InnerBorderEditor";
import { OverflowSettings } from "./OverflowSettings";
import { SizeRangeControl } from "./SizeRangeControl";

type MainVisualEditorProps = {
  slot: HeroMainVisualSlot;
  onChange: (next: HeroSlotConfig) => void;
};

export function MainVisualEditor({ slot, onChange }: MainVisualEditorProps) {
  const foregroundPosition = objectPositionToPercents(slot.foregroundObjectPosition);
  const foregroundPreset = objectPositionPresetValue(slot.foregroundObjectPosition);

  return (
    <div className="space-y-3">
      <EditorSection title="پس زمینه">
        <label className="text-xs text-slate-600">
          رنگ پس زمینه
          <input
            type="color"
            value={resolveColorForInput(slot.backgroundColor, "#f8fafc")}
            onChange={(event) => onChange({ ...slot, backgroundColor: event.target.value })}
            className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white"
          />
        </label>

        <label className="text-xs text-slate-600">
          نوع پس زمینه
          <select
            value={slot.backgroundType}
            onChange={(event) =>
              onChange({
                ...slot,
                backgroundType: event.target.value === "image" ? "image" : "color",
              })
            }
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="color">رنگ</option>
            <option value="image">تصویر</option>
          </select>
        </label>

        <div>
          <p className="mb-1 text-xs text-slate-600">تصویر پس زمینه</p>
          <ImageUploadField
            value={slot.backgroundImageUrl}
            onChange={(value) =>
              onChange({
                ...slot,
                backgroundImageUrl: value,
                backgroundType: value ? "image" : slot.backgroundType,
              })
            }
          />
        </div>

        <SizeRangeControl
          label="مقیاس پس زمینه"
          value={backgroundSizeToPercent(slot.backgroundSize)}
          min={HERO_BACKGROUND_SCALE_MIN}
          max={HERO_BACKGROUND_SCALE_MAX}
          step={1}
          unit="%"
          onChange={(percent) => onChange({ ...slot, backgroundSize: percentToBackgroundSize(percent) })}
        />

        <label className="text-xs text-slate-600">
          موقعیت پس زمینه
          <select
            value={HERO_BACKGROUND_POSITION_PRESETS.some((p) => p.value === slot.backgroundPosition) ? slot.backgroundPosition : ""}
            onChange={(event) => {
              const v = event.target.value;
              if (v) onChange({ ...slot, backgroundPosition: v });
            }}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">سفارشی</option>
            {HERO_BACKGROUND_POSITION_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </EditorSection>

      <EditorSection title="کادر داخلی" defaultOpen={slot.innerBorder.enabled}>
        <InnerBorderEditor
          value={slot.innerBorder}
          onChange={(innerBorder) => onChange({ ...slot, innerBorder })}
          disabledHint={slot.backgroundType === "color" ? undefined : "کادر داخلی فقط وقتی نوع پس زمینه رنگ باشد نمایش داده می شود."}
        />
      </EditorSection>

      <EditorSection title="تصویر اصلی">
        <div>
          <p className="mb-1 text-xs text-slate-600">تصویر اصلی</p>
          <ImageUploadField value={slot.foregroundImageUrl} onChange={(value) => onChange({ ...slot, foregroundImageUrl: value })} />
        </div>

        <label className="text-xs text-slate-600">
          متن جایگزین تصویر
          <input
            type="text"
            value={slot.foregroundAlt}
            onChange={(event) => onChange({ ...slot, foregroundAlt: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>

        <SizeRangeControl
          label="بزرگنمایی تصویر اصلی"
          value={slot.foregroundZoom ?? 1}
          min={HERO_FOREGROUND_ZOOM_MIN}
          max={HERO_FOREGROUND_ZOOM_MAX}
          step={0.05}
          unit="×"
          onChange={(next) => onChange({ ...slot, foregroundZoom: Math.min(HERO_FOREGROUND_ZOOM_MAX, Math.max(HERO_FOREGROUND_ZOOM_MIN, next)) })}
        />
      </EditorSection>

      <EditorSection title="موقعیت و اندازه">
        <SizeRangeControl
          label="عرض تصویر اصلی"
          value={foregroundCustomWidthToPercent(slot.foregroundCustomWidth)}
          min={HERO_FOREGROUND_WIDTH_PERCENT_MIN}
          max={HERO_FOREGROUND_WIDTH_PERCENT_MAX}
          step={1}
          unit="%"
          onChange={(percent) => onChange({ ...slot, foregroundCustomWidth: percentToForegroundCustomWidth(percent) })}
        />

        <SizeRangeControl
          label="ارتفاع تصویر اصلی"
          value={foregroundCustomHeightToPercent(slot.foregroundCustomHeight)}
          min={HERO_FOREGROUND_HEIGHT_PERCENT_MIN}
          max={HERO_FOREGROUND_HEIGHT_PERCENT_MAX}
          step={1}
          unit="%"
          onChange={(percent) => onChange({ ...slot, foregroundCustomHeight: percentToForegroundCustomHeight(percent) })}
        />

        <label className="text-xs text-slate-600">
          موقعیت تصویر اصلی
          <select
            value={foregroundPreset || "custom"}
            onChange={(event) => {
              const value = event.target.value;
              if (value !== "custom") {
                onChange({ ...slot, foregroundObjectPosition: value });
              }
            }}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="custom">سفارشی (اسلایدر)</option>
            {HERO_BACKGROUND_POSITION_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>

        <SizeRangeControl
          label="موقعیت افقی تصویر اصلی"
          value={foregroundPosition.x}
          min={HERO_OBJECT_POSITION_MIN}
          max={HERO_OBJECT_POSITION_MAX}
          step={1}
          unit="%"
          onChange={(x) => onChange({ ...slot, foregroundObjectPosition: percentsToObjectPosition(x, foregroundPosition.y) })}
        />

        <SizeRangeControl
          label="موقعیت عمودی تصویر اصلی"
          value={foregroundPosition.y}
          min={HERO_OBJECT_POSITION_MIN}
          max={HERO_OBJECT_POSITION_MAX}
          step={1}
          unit="%"
          onChange={(y) => onChange({ ...slot, foregroundObjectPosition: percentsToObjectPosition(foregroundPosition.x, y) })}
        />

        <SizeRangeControl
          label="جابجایی افقی (پیکسل)"
          value={slot.foregroundOffsetXPx ?? 0}
          min={HERO_FOREGROUND_OFFSET_MIN_PX}
          max={HERO_FOREGROUND_OFFSET_MAX_PX}
          step={5}
          unit="px"
          onChange={(foregroundOffsetXPx) => onChange({ ...slot, foregroundOffsetXPx })}
        />

        <SizeRangeControl
          label="جابجایی عمودی (پیکسل)"
          value={slot.foregroundOffsetYPx ?? 0}
          min={HERO_FOREGROUND_OFFSET_MIN_PX}
          max={HERO_FOREGROUND_OFFSET_MAX_PX}
          step={5}
          unit="px"
          onChange={(foregroundOffsetYPx) => onChange({ ...slot, foregroundOffsetYPx })}
        />
      </EditorSection>

      <EditorSection title="پیشرفته" defaultOpen={false}>
        <OverflowSettings
          label="خروج تصویر اصلی از بنر"
          value={slot.foregroundOverflow}
          onChange={(foregroundOverflow) => onChange({ ...slot, foregroundOverflow })}
        />
      </EditorSection>
    </div>
  );
}

