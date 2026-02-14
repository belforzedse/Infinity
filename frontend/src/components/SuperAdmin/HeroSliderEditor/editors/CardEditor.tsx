"use client";

import { useState } from "react";
import ImageUploadField from "@/components/SuperAdmin/UpsertPage/ContentWrapper/Fields/ImageUploadField";
import { HERO_CARD_STYLE_PRESETS } from "@/types/super-admin/heroSliderPackages";
import {
  HERO_BACKGROUND_POSITION_PRESETS,
  HERO_BACKGROUND_SIZE_PRESETS,
  type HeroCardSlot,
  type HeroSlotConfig,
} from "@/types/super-admin/heroSlider";
import { resolveColorForInput } from "../utils";
import { TextStyleEditor } from "./TextStyleEditor";

type CardEditorProps = {
  slot: HeroCardSlot;
  onChange: (next: HeroSlotConfig) => void;
};

export function CardEditor({ slot, onChange }: CardEditorProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

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
            event.target.value = "";
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

      <label className="text-xs text-slate-600">
        عنوان کارت
        <input
          type="text"
          value={slot.title}
          onChange={(event) => onChange({ ...slot, title: event.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-xs text-slate-600">
        زیرعنوان کارت
        <input
          type="text"
          value={slot.subtitle}
          onChange={(event) => onChange({ ...slot, subtitle: event.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-xs text-slate-600">
        متن دکمه
        <input
          type="text"
          value={slot.buttonLabel}
          onChange={(event) => onChange({ ...slot, buttonLabel: event.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      {slot.buttonLabel.trim() !== "" ? (
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
          <label className="text-xs text-slate-600">
            آدرس لینک
            <input
              type="text"
              placeholder="/route یا https://..."
              value={slot.buttonHref || slot.link?.href || ""}
              onChange={(event) => {
                const href = event.target.value.trim();
                const type = slot.link?.type ?? "internal";
                onChange({
                  ...slot,
                  buttonHref: href,
                  link: href ? { type, href } : null,
                });
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...slot,
                buttonHref: "",
                link: null,
              })
            }
            className="text-xs text-slate-500 underline hover:text-slate-700"
          >
            حذف لینک
          </button>
        </div>
      ) : null}

      <label className="text-xs text-slate-600">
        رنگ پس‌زمینه
        <input
          type="color"
          value={resolveColorForInput(slot.backgroundColor, "#f1f5f9")}
          onChange={(event) => onChange({ ...slot, backgroundColor: event.target.value })}
          className="mt-1 h-10 w-full rounded-lg border border-slate-200"
        />
      </label>

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
          {advancedOpen ? "بستن تنظیمات پیشرفته" : "تنظیمات پیشرفته کلاس و چیدمان"}
        </button>

        {advancedOpen ? (
          <div className="mt-2 grid grid-cols-1 gap-2">
            <label className="text-xs text-slate-600">
              کلاس کارت
              <input
                type="text"
                value={slot.className}
                onChange={(event) => onChange({ ...slot, className: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              کلاس عنوان
              <input
                type="text"
                value={slot.titleClassName}
                onChange={(event) => onChange({ ...slot, titleClassName: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              کلاس زیرعنوان
              <input
                type="text"
                value={slot.subtitleClassName}
                onChange={(event) => onChange({ ...slot, subtitleClassName: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
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
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="top">بالا</option>
                <option value="center">وسط</option>
                <option value="bottom">پایین</option>
              </select>
            </label>
            <label className="text-xs text-slate-600">
              کلاس فاصله داخلی
              <input
                type="text"
                value={slot.paddingClassName}
                onChange={(event) => onChange({ ...slot, paddingClassName: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              آدرس تصویر لینک
              <input
                type="text"
                value={slot.imageHref}
                onChange={(event) => onChange({ ...slot, imageHref: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              کلاس تصویر
              <input
                type="text"
                value={slot.imageClassName}
                onChange={(event) => onChange({ ...slot, imageClassName: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              موقعیت تصویر
              <input
                type="text"
                value={slot.imageObjectPosition}
                onChange={(event) => onChange({ ...slot, imageObjectPosition: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              عرض تصویر
              <input
                type="text"
                value={slot.imageCustomWidth}
                onChange={(event) => onChange({ ...slot, imageCustomWidth: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              ارتفاع تصویر
              <input
                type="text"
                value={slot.imageCustomHeight}
                onChange={(event) => onChange({ ...slot, imageCustomHeight: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
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
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="color">رنگ</option>
                <option value="image">تصویر</option>
              </select>
            </label>
            <label className="text-xs text-slate-600">
              تصویر پس‌زمینه
              <input
                type="text"
                value={slot.backgroundImageUrl}
                onChange={(event) => onChange({ ...slot, backgroundImageUrl: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
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
              کلاس دکمه
              <input
                type="text"
                value={slot.buttonClassName}
                onChange={(event) => onChange({ ...slot, buttonClassName: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
              <span>نمایش فلش دکمه</span>
              <input
                type="checkbox"
                checked={slot.buttonShowArrow}
                onChange={(event) => onChange({ ...slot, buttonShowArrow: event.target.checked })}
                className="h-4 w-4"
              />
            </label>
            <label className="text-xs text-slate-600">
              کلاس فلش دکمه
              <input
                type="text"
                value={slot.buttonArrowClassName}
                onChange={(event) =>
                  onChange({ ...slot, buttonArrowClassName: event.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
        ) : null}
      </div>
    </div>
  );
}
