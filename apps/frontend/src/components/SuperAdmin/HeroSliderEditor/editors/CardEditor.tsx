"use client";

import { useState } from "react";
import ImageUploadField from "@/components/SuperAdmin/UpsertPage/ContentWrapper/Fields/ImageUploadField";
import { HERO_CARD_STYLE_PRESETS } from "@/types/super-admin/heroSliderPackages";
import {
  HERO_BACKGROUND_POSITION_PRESETS,
  HERO_BACKGROUND_SCALE_MAX,
  HERO_BACKGROUND_SCALE_MIN,
  HERO_CARD_OBJECT_POSITION_MAX,
  HERO_CARD_OBJECT_POSITION_MIN,
  HERO_IMAGE_WIDTH_PERCENT_MAX,
  HERO_IMAGE_WIDTH_PERCENT_MIN,
  backgroundSizeToPercent,
  cardObjectPositionToPercents,
  cardPercentsToObjectPosition,
  customWidthToPercent,
  objectPositionPresetValue,
  percentToBackgroundSize,
  percentToCustomWidth,
  type HeroCardSlot,
  type HeroSlotConfig,
} from "@/types/super-admin/heroSlider";
import { resolveColorForInput } from "../utils";
import { TextStyleEditor } from "./TextStyleEditor";
import { SlotTextField } from "./SlotTextField";
import { OverflowSettings } from "./OverflowSettings";
import { SizeRangeControl } from "./SizeRangeControl";

type CardEditorProps = {
  slot: HeroCardSlot;
  onChange: (next: HeroSlotConfig) => void;
};

export function CardEditor({ slot, onChange }: CardEditorProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const imagePosition = cardObjectPositionToPercents(slot.imageObjectPosition);
  const imagePositionPreset = objectPositionPresetValue(slot.imageObjectPosition);

  return (
    <div className="space-y-3">
      <label className="text-xs text-slate-600">
        پکیج استایل
        <select
          value=""
          onChange={(event) => {
            const id = event.target.value;
            if (!id) return;
            const preset = HERO_CARD_STYLE_PRESETS.find((p) => p.id === id);
            if (!preset) return;
            onChange({
              ...slot,
              titleStyle: { ...slot.titleStyle, ...preset.titleStyle },
              buttonStyle: { ...slot.buttonStyle, ...preset.buttonStyle },
            });
          }}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">اعمال پکیج...</option>
          {HERO_CARD_STYLE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <div>
        <p className="mb-1 text-xs text-slate-600">تصویر کارت</p>
        <ImageUploadField
          value={slot.imageUrl}
          onChange={(value) => onChange({ ...slot, imageUrl: value })}
        />
      </div>

      <SlotTextField
        label="متن جایگزین تصویر"
        value={slot.imageAlt}
        onChange={(value) => onChange({ ...slot, imageAlt: value })}
      />
      <SlotTextField
        label="عنوان کارت"
        value={slot.title}
        onChange={(value) => onChange({ ...slot, title: value })}
      />
      <SlotTextField
        label="زیرعنوان کارت"
        value={slot.subtitle}
        onChange={(value) => onChange({ ...slot, subtitle: value })}
      />
      <SlotTextField
        label="متن دکمه"
        value={slot.buttonLabel}
        onChange={(value) => onChange({ ...slot, buttonLabel: value })}
      />

      <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
        <p className="text-xs font-medium text-slate-600">لینک دکمه</p>
        <label className="text-xs text-slate-600">
          نوع لینک
          <select
            value={slot.link?.type ?? "internal"}
            onChange={(event) => {
              const type = event.target.value === "external" ? "external" : "internal";
              const href = slot.buttonHref || slot.link?.href || "/";
              onChange({
                ...slot,
                buttonHref: href,
                link: href ? { type, href } : null,
              });
            }}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="internal">داخلی</option>
            <option value="external">خارجی</option>
          </select>
        </label>
        <SlotTextField
          label="آدرس لینک"
          value={slot.buttonHref || slot.link?.href || ""}
          onChange={(value) => {
            const href = value.trim();
            const type = slot.link?.type ?? "internal";
            onChange({
              ...slot,
              buttonHref: href,
              link: href ? { type, href } : null,
            });
          }}
          placeholder="/route یا https://..."
          inputClassName="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        />
      </div>

      <SlotTextField
        label="رنگ پس‌زمینه"
        value={resolveColorForInput(slot.backgroundColor, "#f1f5f9")}
        onChange={(value) => onChange({ ...slot, backgroundColor: value })}
        type="color"
        inputClassName="mt-1 h-10 w-full rounded-lg border border-slate-200"
      />

      <div>
        <p className="mb-1 text-xs text-slate-600">تصویر پس‌زمینه کارت</p>
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
        label="مقیاس پس‌زمینه کارت"
        value={backgroundSizeToPercent(slot.backgroundSize)}
        min={HERO_BACKGROUND_SCALE_MIN}
        max={HERO_BACKGROUND_SCALE_MAX}
        step={1}
        unit="%"
        onChange={(percent) =>
          onChange({
            ...slot,
            backgroundSize: percentToBackgroundSize(percent),
          })
        }
      />

      <SizeRangeControl
        label="عرض تصویر محصول"
        value={customWidthToPercent(slot.imageCustomWidth)}
        min={HERO_IMAGE_WIDTH_PERCENT_MIN}
        max={HERO_IMAGE_WIDTH_PERCENT_MAX}
        step={1}
        unit="%"
        onChange={(percent) =>
          onChange({
            ...slot,
            imageCustomWidth: percentToCustomWidth(percent),
          })
        }
      />

      <label className="text-xs text-slate-600">
        موقعیت تصویر محصول
        <select
          value={imagePositionPreset || "custom"}
          onChange={(event) => {
            const value = event.target.value;
            if (value !== "custom") {
              onChange({ ...slot, imageObjectPosition: value });
            }
          }}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
        label="موقعیت افقی تصویر"
        value={imagePosition.x}
        min={HERO_CARD_OBJECT_POSITION_MIN}
        max={HERO_CARD_OBJECT_POSITION_MAX}
        step={1}
        unit="%"
        onChange={(x) =>
          onChange({
            ...slot,
            imageObjectPosition: cardPercentsToObjectPosition(x, imagePosition.y),
          })
        }
      />

      <SizeRangeControl
        label="موقعیت عمودی تصویر"
        value={imagePosition.y}
        min={HERO_CARD_OBJECT_POSITION_MIN}
        max={HERO_CARD_OBJECT_POSITION_MAX}
        step={1}
        unit="%"
        onChange={(y) =>
          onChange({
            ...slot,
            imageObjectPosition: cardPercentsToObjectPosition(imagePosition.x, y),
          })
        }
      />

      <TextStyleEditor
        label="استایل عنوان"
        value={slot.titleStyle}
        onChange={(titleStyle) => onChange({ ...slot, titleStyle })}
      />

      <TextStyleEditor
        label="استایل متن دکمه"
        value={slot.buttonStyle}
        onChange={(buttonStyle) => onChange({ ...slot, buttonStyle })}
      />

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
        <button
          type="button"
          onClick={() => setAdvancedOpen((prev) => !prev)}
          className="text-xs text-slate-600 underline"
        >
          {advancedOpen ? "بستن تنظیمات تصویر و چیدمان" : "تنظیمات تصویر و چیدمان"}
        </button>

        {advancedOpen ? (
          <div className="mt-2 grid grid-cols-1 gap-3">
            <label className="text-xs text-slate-600">
              چیدمان محتوا
              <select
                value={slot.contentAlignment}
                onChange={(event) =>
                  onChange({
                    ...slot,
                    contentAlignment:
                      event.target.value === "top"
                        ? "top"
                        : event.target.value === "bottom"
                          ? "bottom"
                          : "center",
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="top">بالا</option>
                <option value="center">وسط</option>
                <option value="bottom">پایین</option>
              </select>
            </label>
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
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="color">رنگ</option>
                <option value="image">تصویر</option>
              </select>
            </label>
            <OverflowSettings
              label="خروج تصویر از کارت"
              value={slot.imageOverflow}
              onChange={(imageOverflow) => onChange({ ...slot, imageOverflow })}
            />
            <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
              <span>نمایش فلش دکمه</span>
              <input
                type="checkbox"
                checked={slot.buttonShowArrow}
                onChange={(event) => onChange({ ...slot, buttonShowArrow: event.target.checked })}
                className="h-4 w-4"
              />
            </label>
          </div>
        ) : null}
      </div>
    </div>
  );
}
