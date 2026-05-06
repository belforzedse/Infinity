"use client";

import { useState } from "react";
import ImageUploadField from "@/components/SuperAdmin/UpsertPage/ContentWrapper/Fields/ImageUploadField";
import { HERO_CARD_STYLE_PRESETS } from "@/types/super-admin/heroSliderPackages";
import { type HeroCardSlot, type HeroSlotConfig } from "@/types/super-admin/heroSlider";
import { resolveColorForInput } from "../utils";
import { TextStyleEditor } from "./TextStyleEditor";
import { SlotTextField } from "./SlotTextField";
import { BackgroundSettings } from "./BackgroundSettings";
import { ImageSettings } from "./ImageSettings";

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

      <SlotTextField
        label="رنگ پس‌زمینه"
        value={resolveColorForInput(slot.backgroundColor, "#f1f5f9")}
        onChange={(value) => onChange({ ...slot, backgroundColor: value })}
        type="color"
        inputClassName="mt-1 h-10 w-full rounded-lg border border-slate-200"
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
          {advancedOpen ? "بستن تنظیمات پیشرفته" : "تنظیمات پیشرفته کلاس و چیدمان"}
        </button>

        {advancedOpen ? (
          <div className="mt-2 grid grid-cols-1 gap-2">
            <SlotTextField
              label="کلاس کارت"
              value={slot.className}
              onChange={(value) => onChange({ ...slot, className: value })}
            />
            <SlotTextField
              label="کلاس عنوان"
              value={slot.titleClassName}
              onChange={(value) => onChange({ ...slot, titleClassName: value })}
            />
            <SlotTextField
              label="کلاس زیرعنوان"
              value={slot.subtitleClassName}
              onChange={(value) => onChange({ ...slot, subtitleClassName: value })}
            />
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
            <SlotTextField
              label="کلاس فاصله داخلی"
              value={slot.paddingClassName}
              onChange={(value) => onChange({ ...slot, paddingClassName: value })}
            />
            <ImageSettings slot={slot} onChange={onChange} />
            <BackgroundSettings slot={slot} onChange={onChange} />
            <SlotTextField
              label="کلاس دکمه"
              value={slot.buttonClassName}
              onChange={(value) => onChange({ ...slot, buttonClassName: value })}
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
            <SlotTextField
              label="کلاس فلش دکمه"
              value={slot.buttonArrowClassName}
              onChange={(value) => onChange({ ...slot, buttonArrowClassName: value })}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
