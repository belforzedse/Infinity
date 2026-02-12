"use client";

import { type ReactNode, type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ActionBanner } from "@/components/Hero/Banners/ActionBanner";
import { LeftBanner } from "@/components/Hero/Banners/LeftBanner";
import TextBanner from "@/components/Hero/Banners/TextBanner";
import { mapHeroSlideToLayoutsForEditor, type CmsHeroEditorLayouts } from "@/components/Hero/config/fromCms";
import ImageUploadField from "@/components/SuperAdmin/UpsertPage/ContentWrapper/Fields/ImageUploadField";
import {
  HERO_DESKTOP_SLOT_KEYS,
  HERO_FONT_FAMILY_OPTIONS,
  HERO_FONT_SIZE_OPTIONS,
  HERO_FONT_WEIGHT_OPTIONS,
  HERO_LETTER_SPACING_OPTIONS,
  HERO_LINE_HEIGHT_OPTIONS,
  HERO_MOBILE_SLOT_KEYS,
  HERO_TABLET_SLOT_KEYS,
  type HeroCardSlot,
  type HeroDesktopSlotKey,
  type HeroFontFamilyToken,
  type HeroFontSizeToken,
  type HeroFontWeightToken,
  type HeroHeadlineSlot,
  type HeroLetterSpacingToken,
  type HeroLineHeightToken,
  type HeroMainVisualSlot,
  type HeroSlideConfig,
  type HeroSlotConfig,
  type HeroTabletSlotKey,
  type HeroTextStyle,
  type HeroMobileSlotKey,
} from "@/types/super-admin/heroSlider";

type DeviceMode = "desktop" | "tablet" | "mobile";
export type SlotKey = HeroDesktopSlotKey | HeroTabletSlotKey | HeroMobileSlotKey;

type Props = {
  slide: HeroSlideConfig | null;
  device: DeviceMode;
  selectedSlotKey: SlotKey;
  onSelectSlot: (slotKey: SlotKey) => void;
  onChangeSelectedSlot: (next: HeroSlotConfig) => void;
};

type PopoverPosition = {
  top: number;
  left: number;
};

const FALLBACK_IMAGE_SRC = "/images/placeholders/image-placeholder.svg";

const slotLabelMap: Record<string, string> = {
  topLeftTextBanner: "تیتر",
  primaryBanner: "تیتر",
  rightBanner: "تصویر اصلی",
  heroBanner: "تصویر اصلی",
  bottomActionBannerLeft: "کارت ۱",
  bottomActionBannerRight: "کارت ۲",
};

const POPOVER_WIDTH = 340;
const POPOVER_GAP = 10;
const VIEWPORT_PADDING = 12;

function getFrameByDevice(device: DeviceMode): { width: number; height: number } {
  if (device === "desktop") return { width: 1220, height: 560 };
  if (device === "tablet") return { width: 980, height: 760 };
  return { width: 430, height: 920 };
}

function safeImageSrc(src?: string): string {
  if (typeof src !== "string") return FALLBACK_IMAGE_SRC;
  const normalized = src.trim();
  return normalized ? normalized : FALLBACK_IMAGE_SRC;
}

function makeLayoutsSafe(layouts: CmsHeroEditorLayouts): CmsHeroEditorLayouts {
  return {
    desktop: {
      ...layouts.desktop,
      bottomActionBannerLeft: {
        ...layouts.desktop.bottomActionBannerLeft,
        image: {
          ...layouts.desktop.bottomActionBannerLeft.image,
          src: safeImageSrc(layouts.desktop.bottomActionBannerLeft.image.src),
        },
      },
      bottomActionBannerRight: {
        ...layouts.desktop.bottomActionBannerRight,
        image: {
          ...layouts.desktop.bottomActionBannerRight.image,
          src: safeImageSrc(layouts.desktop.bottomActionBannerRight.image.src),
        },
      },
      rightBanner: {
        ...layouts.desktop.rightBanner,
        foregroundImage: {
          ...layouts.desktop.rightBanner.foregroundImage,
          src: safeImageSrc(layouts.desktop.rightBanner.foregroundImage.src),
        },
      },
    },
    tablet: {
      ...layouts.tablet,
      bottomActionBannerLeft: {
        ...layouts.tablet.bottomActionBannerLeft,
        image: {
          ...layouts.tablet.bottomActionBannerLeft.image,
          src: safeImageSrc(layouts.tablet.bottomActionBannerLeft.image.src),
        },
      },
      bottomActionBannerRight: {
        ...layouts.tablet.bottomActionBannerRight,
        image: {
          ...layouts.tablet.bottomActionBannerRight.image,
          src: safeImageSrc(layouts.tablet.bottomActionBannerRight.image.src),
        },
      },
      heroBanner: {
        ...layouts.tablet.heroBanner,
        foregroundImage: {
          ...layouts.tablet.heroBanner.foregroundImage,
          src: safeImageSrc(layouts.tablet.heroBanner.foregroundImage.src),
        },
      },
    },
    mobile: {
      ...layouts.mobile,
      bottomActionBannerLeft: {
        ...layouts.mobile.bottomActionBannerLeft,
        image: {
          ...layouts.mobile.bottomActionBannerLeft.image,
          src: safeImageSrc(layouts.mobile.bottomActionBannerLeft.image.src),
        },
      },
      bottomActionBannerRight: {
        ...layouts.mobile.bottomActionBannerRight,
        image: {
          ...layouts.mobile.bottomActionBannerRight.image,
          src: safeImageSrc(layouts.mobile.bottomActionBannerRight.image.src),
        },
      },
      heroBanner: {
        ...layouts.mobile.heroBanner,
        foregroundImage: {
          ...layouts.mobile.heroBanner.foregroundImage,
          src: safeImageSrc(layouts.mobile.heroBanner.foregroundImage.src),
        },
      },
    },
  };
}

function getPopoverPosition(anchorRect: DOMRect, popoverHeight: number): PopoverPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const safeHeight = Math.max(popoverHeight, 320);

  let left = anchorRect.left;
  if (left + POPOVER_WIDTH > viewportWidth - VIEWPORT_PADDING) {
    left = viewportWidth - POPOVER_WIDTH - VIEWPORT_PADDING;
  }
  left = Math.max(VIEWPORT_PADDING, left);

  const spaceBelow = viewportHeight - anchorRect.bottom - VIEWPORT_PADDING;
  const spaceAbove = anchorRect.top - VIEWPORT_PADDING;
  const shouldOpenAbove = spaceBelow < safeHeight && spaceAbove > spaceBelow;

  let top = shouldOpenAbove
    ? anchorRect.top - safeHeight - POPOVER_GAP
    : anchorRect.bottom + POPOVER_GAP;

  top = Math.max(VIEWPORT_PADDING, top);
  top = Math.min(top, viewportHeight - safeHeight - VIEWPORT_PADDING);

  return { top, left };
}

function resolveColorForInput(value: string, fallback = "#111827"): string {
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
    return value;
  }
  return fallback;
}

function TextStyleEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: HeroTextStyle;
  onChange: (next: HeroTextStyle) => void;
}) {
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

        <label className="text-xs text-slate-600">
          اندازه
          <select
            value={value.fontSize}
            onChange={(event) =>
              onChange({
                ...value,
                fontSize: event.target.value as HeroFontSizeToken,
              })
            }
            className="mt-1 w-full rounded-md border border-slate-200 px-2 py-2 text-xs"
          >
            {HERO_FONT_SIZE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
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

function HeadlineEditor({
  slot,
  onChange,
}: {
  slot: HeroHeadlineSlot;
  onChange: (next: HeroSlotConfig) => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="space-y-3">
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

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
        <button
          type="button"
          onClick={() => setAdvancedOpen((prev) => !prev)}
          className="text-xs text-slate-600 underline"
        >
          {advancedOpen ? "بستن تنظیمات کلاس" : "تنظیمات کلاس و چیدمان"}
        </button>

        {advancedOpen ? (
          <div className="mt-2 grid grid-cols-1 gap-2">
            <label className="text-xs text-slate-600">
              کلاس کانتینر
              <input
                type="text"
                value={slot.className}
                onChange={(event) => onChange({ ...slot, className: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              کلاس تیتر
              <input
                type="text"
                value={slot.titleClassName}
                onChange={(event) => onChange({ ...slot, titleClassName: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              کلاس زیرتیتر
              <input
                type="text"
                value={slot.subtitleClassName}
                onChange={(event) => onChange({ ...slot, subtitleClassName: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
        ) : null}
      </div>

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

function MainVisualEditor({
  slot,
  onChange,
}: {
  slot: HeroMainVisualSlot;
  onChange: (next: HeroSlotConfig) => void;
}) {
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

function CardEditor({
  slot,
  onChange,
}: {
  slot: HeroCardSlot;
  onChange: (next: HeroSlotConfig) => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="space-y-3">
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

function SlotPopover({
  slot,
  onChange,
  onClose,
  position,
  popoverRef,
}: {
  slot: HeroSlotConfig;
  onChange: (next: HeroSlotConfig) => void;
  onClose: () => void;
  position: PopoverPosition;
  popoverRef: RefObject<HTMLDivElement | null>;
}) {
  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[1200] w-[340px] max-h-[min(70vh,680px)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-2xl"
      style={position}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">ویرایش درجا</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
        >
          بستن
        </button>
      </div>

      {slot.kind === "headline" ? <HeadlineEditor slot={slot} onChange={onChange} /> : null}
      {slot.kind === "mainVisual" ? <MainVisualEditor slot={slot} onChange={onChange} /> : null}
      {slot.kind === "card" ? <CardEditor slot={slot} onChange={onChange} /> : null}
    </div>,
    document.body,
  );
}

function EditableSlot({
  slotKey,
  selected,
  onSelect,
  className,
  children,
}: {
  slotKey: SlotKey;
  selected: boolean;
  onSelect: (anchorEl: HTMLElement) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`relative overflow-visible ${className || ""}`} data-slot={slotKey}>
      {children}

      <button
        type="button"
        onClick={(event) => onSelect(event.currentTarget)}
        className={`absolute inset-0 z-20 rounded-lg transition ${
          selected
            ? "ring-2 ring-pink-500 ring-offset-2 ring-offset-white"
            : "ring-1 ring-transparent hover:ring-pink-300"
        }`}
        aria-label={`ویرایش ${slotLabelMap[slotKey] || slotKey}`}
      />

      <div className="pointer-events-none absolute left-2 top-2 z-30 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-600 shadow-sm">
        {slotLabelMap[slotKey] || slotKey}
      </div>
    </div>
  );
}

function DesktopCanvas({
  layouts,
  selectedSlotKey,
  onSelectSlot,
}: {
  layouts: CmsHeroEditorLayouts;
  selectedSlotKey: SlotKey;
  onSelectSlot: (slotKey: SlotKey, anchorEl: HTMLElement) => void;
}) {
  const layout = layouts.desktop;

  return (
    <div className="h-[480px] w-[1200px] overflow-visible px-4">
      <div className="relative h-full w-full">
        <div className="flex h-full items-stretch gap-2 lg:gap-0">
          <div className="mt-[50px] h-full w-7/12 flex-none overflow-visible">
            <div className="flex h-full flex-col">
              <EditableSlot
                slotKey="topLeftTextBanner"
                selected={selectedSlotKey === "topLeftTextBanner"}
                onSelect={(anchorEl) => onSelectSlot("topLeftTextBanner", anchorEl)}
              >
                <TextBanner
                  title={layout.topLeftTextBanner.title}
                  subtitle={layout.topLeftTextBanner.subtitle}
                  marginBottomPx={layout.topLeftTextBanner.marginBottomPx}
                  className={layout.topLeftTextBanner.className}
                  titleClassName={layout.topLeftTextBanner.titleClassName}
                  subtitleClassName={layout.topLeftTextBanner.subtitleClassName}
                  colors={layout.topLeftTextBanner.colors}
                  typography={layout.topLeftTextBanner.typography}
                />
              </EditableSlot>

              <div className="grid flex-1 grid-cols-2 items-end gap-3">
                <EditableSlot
                  slotKey="bottomActionBannerLeft"
                  selected={selectedSlotKey === "bottomActionBannerLeft"}
                  onSelect={(anchorEl) => onSelectSlot("bottomActionBannerLeft", anchorEl)}
                  className="h-full rounded-lg"
                >
                  <ActionBanner spec={layout.bottomActionBannerLeft} />
                </EditableSlot>

                <EditableSlot
                  slotKey="bottomActionBannerRight"
                  selected={selectedSlotKey === "bottomActionBannerRight"}
                  onSelect={(anchorEl) => onSelectSlot("bottomActionBannerRight", anchorEl)}
                  className="h-full rounded-lg"
                >
                  <ActionBanner spec={layout.bottomActionBannerRight} />
                </EditableSlot>
              </div>
            </div>
          </div>

          <div className="w-5/12 flex-none">
            <EditableSlot
              slotKey="rightBanner"
              selected={selectedSlotKey === "rightBanner"}
              onSelect={(anchorEl) => onSelectSlot("rightBanner", anchorEl)}
              className="h-full rounded-lg"
            >
              <LeftBanner spec={layout.rightBanner} className="h-full w-full" />
            </EditableSlot>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabletCanvas({
  layouts,
  selectedSlotKey,
  onSelectSlot,
}: {
  layouts: CmsHeroEditorLayouts;
  selectedSlotKey: SlotKey;
  onSelectSlot: (slotKey: SlotKey, anchorEl: HTMLElement) => void;
}) {
  const layout = layouts.tablet;

  return (
    <div className="w-[960px] px-4">
      <div className="grid grid-cols-1 gap-6">
        <EditableSlot
          slotKey="primaryBanner"
          selected={selectedSlotKey === "primaryBanner"}
          onSelect={(anchorEl) => onSelectSlot("primaryBanner", anchorEl)}
          className="overflow-visible rounded-3xl"
        >
          <TextBanner
            title={layout.primaryBanner.title}
            subtitle={layout.primaryBanner.subtitle}
            marginBottomPx={layout.primaryBanner.marginBottomPx}
            className={layout.primaryBanner.className}
            titleClassName={layout.primaryBanner.titleClassName}
            subtitleClassName={layout.primaryBanner.subtitleClassName}
            colors={layout.primaryBanner.colors}
            typography={layout.primaryBanner.typography}
          />
        </EditableSlot>

        <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:[direction:ltr]">
          <div className="flex flex-col gap-6 md:h-full md:justify-end" dir="rtl">
            <EditableSlot
              slotKey="bottomActionBannerLeft"
              selected={selectedSlotKey === "bottomActionBannerLeft"}
              onSelect={(anchorEl) => onSelectSlot("bottomActionBannerLeft", anchorEl)}
              className="rounded-lg"
            >
              <ActionBanner spec={layout.bottomActionBannerLeft} />
            </EditableSlot>

            <EditableSlot
              slotKey="bottomActionBannerRight"
              selected={selectedSlotKey === "bottomActionBannerRight"}
              onSelect={(anchorEl) => onSelectSlot("bottomActionBannerRight", anchorEl)}
              className="rounded-lg"
            >
              <ActionBanner spec={layout.bottomActionBannerRight} />
            </EditableSlot>
          </div>

          <EditableSlot
            slotKey="heroBanner"
            selected={selectedSlotKey === "heroBanner"}
            onSelect={(anchorEl) => onSelectSlot("heroBanner", anchorEl)}
            className="relative aspect-square overflow-visible rounded-lg"
          >
            <LeftBanner spec={layout.heroBanner} className="h-full w-full" />
          </EditableSlot>
        </div>
      </div>
    </div>
  );
}

function MobileCanvas({
  layouts,
  selectedSlotKey,
  onSelectSlot,
}: {
  layouts: CmsHeroEditorLayouts;
  selectedSlotKey: SlotKey;
  onSelectSlot: (slotKey: SlotKey, anchorEl: HTMLElement) => void;
}) {
  const layout = layouts.mobile;

  return (
    <div className="w-[410px] px-2" dir="rtl">
      <div className="flex flex-col gap-4">
        <EditableSlot
          slotKey="primaryBanner"
          selected={selectedSlotKey === "primaryBanner"}
          onSelect={(anchorEl) => onSelectSlot("primaryBanner", anchorEl)}
          className="overflow-visible rounded-3xl"
        >
          <TextBanner
            title={layout.primaryBanner.title}
            subtitle={layout.primaryBanner.subtitle}
            marginBottomPx={layout.primaryBanner.marginBottomPx}
            className={layout.primaryBanner.className}
            titleClassName={layout.primaryBanner.titleClassName}
            subtitleClassName={layout.primaryBanner.subtitleClassName}
            colors={layout.primaryBanner.colors}
            typography={layout.primaryBanner.typography}
          />
        </EditableSlot>

        <EditableSlot
          slotKey="heroBanner"
          selected={selectedSlotKey === "heroBanner"}
          onSelect={(anchorEl) => onSelectSlot("heroBanner", anchorEl)}
          className="relative h-[360px] w-full overflow-visible rounded-3xl"
        >
          <LeftBanner spec={layout.heroBanner} className="h-full w-full" />
        </EditableSlot>

        <div className="grid grid-cols-2 gap-3">
          <EditableSlot
            slotKey="bottomActionBannerLeft"
            selected={selectedSlotKey === "bottomActionBannerLeft"}
            onSelect={(anchorEl) => onSelectSlot("bottomActionBannerLeft", anchorEl)}
            className="rounded-xl"
          >
            <ActionBanner spec={layout.bottomActionBannerLeft} />
          </EditableSlot>

          <EditableSlot
            slotKey="bottomActionBannerRight"
            selected={selectedSlotKey === "bottomActionBannerRight"}
            onSelect={(anchorEl) => onSelectSlot("bottomActionBannerRight", anchorEl)}
            className="rounded-xl"
          >
            <ActionBanner spec={layout.bottomActionBannerRight} />
          </EditableSlot>
        </div>
      </div>
    </div>
  );
}

export default function TemplatePreview({
  slide,
  device,
  selectedSlotKey,
  onSelectSlot,
  onChangeSelectedSlot,
}: Props) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverAnchorEl, setPopoverAnchorEl] = useState<HTMLElement | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition>({ top: 0, left: 0 });
  const [viewportWidth, setViewportWidth] = useState(0);

  const frame = useMemo(() => getFrameByDevice(device), [device]);
  const scale = useMemo(() => {
    if (!viewportWidth) return 1;
    return Math.min(1, viewportWidth / frame.width);
  }, [frame.width, viewportWidth]);

  useEffect(() => {
    const target = viewportRef.current;
    if (!target) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setViewportWidth(entry.contentRect.width);
    });

    resizeObserver.observe(target);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    setPopoverOpen(false);
    setPopoverAnchorEl(null);
  }, [device, slide?.id]);

  useEffect(() => {
    if (!popoverOpen) return;

    const onDocumentPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!previewRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setPopoverOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPopoverOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocumentPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [popoverOpen]);

  const layouts = useMemo(() => {
    if (!slide) return null;
    return makeLayoutsSafe(mapHeroSlideToLayoutsForEditor(slide));
  }, [slide]);

  const selectedSlot = useMemo(() => {
    if (!slide) return null;
    if (device === "desktop") return slide.devices.desktop.slots[selectedSlotKey as HeroDesktopSlotKey] || null;
    if (device === "tablet") return slide.devices.tablet.slots[selectedSlotKey as HeroTabletSlotKey] || null;
    return slide.devices.mobile.slots[selectedSlotKey as HeroMobileSlotKey] || null;
  }, [device, selectedSlotKey, slide]);

  useEffect(() => {
    if (!popoverOpen || !popoverAnchorEl) return;

    const updatePosition = () => {
      const anchorRect = popoverAnchorEl.getBoundingClientRect();
      if (anchorRect.width === 0 && anchorRect.height === 0) return;
      const popoverHeight = popoverRef.current?.offsetHeight ?? 460;
      setPopoverPosition(getPopoverPosition(anchorRect, popoverHeight));
    };

    updatePosition();
    let resizeObserver: ResizeObserver | null = null;
    if (popoverRef.current) {
      resizeObserver = new ResizeObserver(() => updatePosition());
      resizeObserver.observe(popoverRef.current);
    }
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [popoverOpen, popoverAnchorEl, selectedSlot]);

  const handleSlotSelect = (slotKey: SlotKey, anchorEl: HTMLElement) => {
    onSelectSlot(slotKey);
    setPopoverAnchorEl(anchorEl);
    setPopoverOpen(true);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">پیش‌نمایش قالب</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          {device === "desktop" ? "دسکتاپ" : device === "tablet" ? "تبلت" : "موبایل"}
        </span>
      </div>

      {!slide || !layouts ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          یک اسلاید را انتخاب یا ایجاد کنید.
        </div>
      ) : (
        <div ref={previewRef} className="space-y-3">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            اسلات در حال ویرایش:{" "}
            <span className="font-semibold text-slate-800">
              {slotLabelMap[selectedSlotKey] || "اسلات"}
            </span>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-500">
            افزودن فونت جدید برای انتخابگر فونت: <code>frontend/public/fonts</code> سپس ثبت در{" "}
            <code>frontend/src/styles/fonts.ts</code> و <code>frontend/tailwind.config.ts</code>
          </div>

          <div ref={viewportRef} className="w-full overflow-visible">
            <div className="mx-auto" style={{ width: frame.width * scale, height: frame.height * scale }}>
              <div
                style={{
                  width: frame.width,
                  height: frame.height,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
                onClickCapture={(event) => {
                  const target = event.target as HTMLElement;
                  if (target.closest("a")) {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                }}
              >
                {device === "desktop" ? (
                  <DesktopCanvas
                    layouts={layouts}
                    selectedSlotKey={selectedSlotKey}
                    onSelectSlot={handleSlotSelect}
                  />
                ) : null}

                {device === "tablet" ? (
                  <TabletCanvas
                    layouts={layouts}
                    selectedSlotKey={selectedSlotKey}
                    onSelectSlot={handleSlotSelect}
                  />
                ) : null}

                {device === "mobile" ? (
                  <MobileCanvas
                    layouts={layouts}
                    selectedSlotKey={selectedSlotKey}
                    onSelectSlot={handleSlotSelect}
                  />
                ) : null}
              </div>
            </div>
          </div>

          {selectedSlot && popoverOpen && popoverAnchorEl ? (
            <SlotPopover
              slot={selectedSlot}
              onChange={onChangeSelectedSlot}
              onClose={() => setPopoverOpen(false)}
              position={popoverPosition}
              popoverRef={popoverRef}
            />
          ) : null}
        </div>
      )}
    </section>
  );
}

export function getDefaultSlotKeyByDevice(device: DeviceMode): SlotKey {
  if (device === "desktop") return HERO_DESKTOP_SLOT_KEYS[0];
  if (device === "tablet") return HERO_TABLET_SLOT_KEYS[0];
  return HERO_MOBILE_SLOT_KEYS[0];
}

export function getSlotKeysByDevice(device: DeviceMode): readonly SlotKey[] {
  if (device === "desktop") return HERO_DESKTOP_SLOT_KEYS;
  if (device === "tablet") return HERO_TABLET_SLOT_KEYS;
  return HERO_MOBILE_SLOT_KEYS;
}
