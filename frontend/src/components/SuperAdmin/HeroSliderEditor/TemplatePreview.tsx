"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pencil, PanelLeftClose, PanelRight } from "lucide-react";
import { ActionBanner } from "@/components/Hero/Banners/ActionBanner";
import { LeftBanner } from "@/components/Hero/Banners/LeftBanner";
import TextBanner from "@/components/Hero/Banners/TextBanner";
import { mapHeroSlideToLayoutsForEditor, type CmsHeroEditorLayouts } from "@/components/Hero/config/fromCms";
import type { BannerImageSpec } from "@/components/Hero/types";
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
  selectedSlotKey: SlotKey | null;
  onSelectSlot: (slotKey: SlotKey) => void;
  onDeselectSlot?: () => void;
  onChangeSelectedSlot: (next: HeroSlotConfig) => void;
  onDeviceChange?: (device: DeviceMode) => void;
  useSidePanel?: boolean;
};

const FALLBACK_IMAGE_SRC = "/images/placeholders/image-placeholder.svg";
const HERO_MAIN_PLACEHOLDER = "/images/placeholders/HeroEditorMainVisualSlot.png";
const HERO_CARD_PLACEHOLDER = "/images/placeholders/HeroEditorCardSlot.png";

const slotLabelMap: Record<string, string> = {
  topLeftTextBanner: "تیتر",
  primaryBanner: "تیتر",
  rightBanner: "تصویر اصلی",
  heroBanner: "تصویر اصلی",
  bottomActionBannerLeft: "کارت ۱",
  bottomActionBannerRight: "کارت ۲",
};

function getFrameByDevice(device: DeviceMode): { width: number; height: number } {
  if (device === "desktop") return { width: 1358, height: 480 };
  if (device === "tablet") return { width: 960, height: 820 };
  return { width: 430, height: 920 };
}

function safeImageSrc(src?: string, fallback = FALLBACK_IMAGE_SRC): string {
  if (typeof src !== "string") return fallback;
  const normalized = src.trim();
  return normalized ? normalized : fallback;
}

const HERO_CARD_PLACEHOLDER_ZOOM = 0.7;

function makeLayoutsSafe(layouts: CmsHeroEditorLayouts): CmsHeroEditorLayouts {
  const cardImageWithPlaceholder = (img: BannerImageSpec): BannerImageSpec => {
    const src = safeImageSrc(img.src, HERO_CARD_PLACEHOLDER);
    const isPlaceholder = !(typeof img.src === "string" && img.src.trim());
    return {
      ...img,
      src,
      ...(isPlaceholder && { zoom: HERO_CARD_PLACEHOLDER_ZOOM }),
    };
  };

  return {
    desktop: {
      ...layouts.desktop,
      bottomActionBannerLeft: {
        ...layouts.desktop.bottomActionBannerLeft,
        image: cardImageWithPlaceholder(layouts.desktop.bottomActionBannerLeft.image),
      },
      bottomActionBannerRight: {
        ...layouts.desktop.bottomActionBannerRight,
        image: cardImageWithPlaceholder(layouts.desktop.bottomActionBannerRight.image),
      },
      rightBanner: {
        ...layouts.desktop.rightBanner,
        foregroundImage: {
          ...layouts.desktop.rightBanner.foregroundImage,
          src: safeImageSrc(
            layouts.desktop.rightBanner.foregroundImage.src,
            HERO_MAIN_PLACEHOLDER,
          ),
        },
      },
    },
    tablet: {
      ...layouts.tablet,
      bottomActionBannerLeft: {
        ...layouts.tablet.bottomActionBannerLeft,
        image: cardImageWithPlaceholder(layouts.tablet.bottomActionBannerLeft.image),
      },
      bottomActionBannerRight: {
        ...layouts.tablet.bottomActionBannerRight,
        image: cardImageWithPlaceholder(layouts.tablet.bottomActionBannerRight.image),
      },
      heroBanner: {
        ...layouts.tablet.heroBanner,
        foregroundImage: {
          ...layouts.tablet.heroBanner.foregroundImage,
          src: safeImageSrc(
            layouts.tablet.heroBanner.foregroundImage.src,
            HERO_MAIN_PLACEHOLDER,
          ),
        },
      },
    },
    mobile: {
      ...layouts.mobile,
      bottomActionBannerLeft: {
        ...layouts.mobile.bottomActionBannerLeft,
        image: cardImageWithPlaceholder(layouts.mobile.bottomActionBannerLeft.image),
      },
      bottomActionBannerRight: {
        ...layouts.mobile.bottomActionBannerRight,
        image: cardImageWithPlaceholder(layouts.mobile.bottomActionBannerRight.image),
      },
      heroBanner: {
        ...layouts.mobile.heroBanner,
        foregroundImage: {
          ...layouts.mobile.heroBanner.foregroundImage,
          src: safeImageSrc(
            layouts.mobile.heroBanner.foregroundImage.src,
            HERO_MAIN_PLACEHOLDER,
          ),
        },
      },
    },
  };
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

function SlotEditorContent({
  slot,
  onChange,
  onClose,
}: {
  slot: HeroSlotConfig;
  onChange: (next: HeroSlotConfig) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">ویرایش اسلات</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
        >
          بستن
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {slot.kind === "headline" ? <HeadlineEditor slot={slot} onChange={onChange} /> : null}
        {slot.kind === "mainVisual" ? <MainVisualEditor slot={slot} onChange={onChange} /> : null}
        {slot.kind === "card" ? <CardEditor slot={slot} onChange={onChange} /> : null}
      </div>
    </div>
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
  const [isHovered, setIsHovered] = useState(false);
  const label = slotLabelMap[slotKey] || slotKey;

  return (
    <div
      className={`group relative overflow-visible ${className || ""}`}
      data-slot={slotKey}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      <button
        type="button"
        onClick={(event) => onSelect(event.currentTarget)}
        className={`absolute inset-0 z-20 rounded-lg transition-all duration-200 ring-inset ${
          selected
            ? "ring-2 ring-pink-500"
            : "ring-1 ring-transparent hover:ring-2 hover:ring-pink-400/60"
        }`}
        aria-label={`ویرایش ${label}`}
        title="برای ویرایش کلیک کنید"
      />

      {/* Hover overlay with edit hint */}
      {isHovered && !selected && (
        <div className="pointer-events-none absolute inset-0 z-[21] flex items-center justify-center rounded-lg bg-black/5">
          <span className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-md">
            کلیک برای ویرایش
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute left-2 top-2 z-30 flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-slate-600 shadow-sm">
        <Pencil className="h-3 w-3 text-slate-500" aria-hidden />
        {label}
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
    <div className="h-[480px] w-full max-w-[1358px] overflow-hidden mx-auto">
      <div className="relative h-full w-full">
        <div className="flex h-full items-stretch gap-0">
          <div className="w-7/12 mt-[50px] flex-none overflow-hidden h-full">
            <div className="flex flex-col h-full">
              <div>
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
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3 items-end">
                <div className="h-full overflow-hidden rounded-lg">
                  <EditableSlot
                    slotKey="bottomActionBannerLeft"
                    selected={selectedSlotKey === "bottomActionBannerLeft"}
                    onSelect={(anchorEl) => onSelectSlot("bottomActionBannerLeft", anchorEl)}
                    className="h-full w-full block"
                  >
                    <ActionBanner spec={layout.bottomActionBannerLeft} />
                  </EditableSlot>
                </div>
                <div className="h-full overflow-hidden rounded-lg">
                  <EditableSlot
                    slotKey="bottomActionBannerRight"
                    selected={selectedSlotKey === "bottomActionBannerRight"}
                    onSelect={(anchorEl) => onSelectSlot("bottomActionBannerRight", anchorEl)}
                    className="h-full w-full block"
                  >
                    <ActionBanner spec={layout.bottomActionBannerRight} />
                  </EditableSlot>
                </div>
              </div>
            </div>
          </div>
          <div className="w-5/12 flex-none overflow-hidden">
            <div className="h-full w-full overflow-hidden rounded-lg">
              <EditableSlot
                slotKey="rightBanner"
                selected={selectedSlotKey === "rightBanner"}
                onSelect={(anchorEl) => onSelectSlot("rightBanner", anchorEl)}
                className="h-full w-full block"
              >
                <LeftBanner spec={layout.rightBanner} className="h-full w-full" />
              </EditableSlot>
            </div>
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
    <div className="h-auto w-full max-w-full overflow-hidden">
      <div className="grid grid-cols-1 gap-6">
        <div className="overflow-hidden rounded-3xl">
          <EditableSlot
            slotKey="primaryBanner"
            selected={selectedSlotKey === "primaryBanner"}
            onSelect={(anchorEl) => onSelectSlot("primaryBanner", anchorEl)}
            className="block"
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
        </div>
        <div className="grid gap-6 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] [direction:ltr]">
          <div className="flex flex-col gap-6 h-full justify-end" dir="rtl">
            <div className="relative rounded-lg overflow-visible">
              <EditableSlot
                slotKey="bottomActionBannerLeft"
                selected={selectedSlotKey === "bottomActionBannerLeft"}
                onSelect={(anchorEl) => onSelectSlot("bottomActionBannerLeft", anchorEl)}
                className="h-full w-full block"
              >
                <ActionBanner spec={layout.bottomActionBannerLeft} />
              </EditableSlot>
            </div>
            <div className="relative rounded-lg overflow-visible">
              <EditableSlot
                slotKey="bottomActionBannerRight"
                selected={selectedSlotKey === "bottomActionBannerRight"}
                onSelect={(anchorEl) => onSelectSlot("bottomActionBannerRight", anchorEl)}
                className="h-full w-full block"
              >
                <ActionBanner spec={layout.bottomActionBannerRight} />
              </EditableSlot>
            </div>
          </div>
          <div
            className="relative aspect-square overflow-hidden rounded-lg"
            dir="rtl"
          >
            <EditableSlot
              slotKey="heroBanner"
              selected={selectedSlotKey === "heroBanner"}
              onSelect={(anchorEl) => onSelectSlot("heroBanner", anchorEl)}
              className="h-full w-full block"
            >
              <LeftBanner spec={layout.heroBanner} className="h-full w-full" />
            </EditableSlot>
          </div>
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
    <div className="h-auto w-full max-w-full overflow-hidden" dir="rtl">
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-3xl">
          <EditableSlot
            slotKey="primaryBanner"
            selected={selectedSlotKey === "primaryBanner"}
            onSelect={(anchorEl) => onSelectSlot("primaryBanner", anchorEl)}
            className="block"
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
        </div>
        <div className="relative h-[360px] w-full overflow-hidden rounded-3xl">
          <EditableSlot
            slotKey="heroBanner"
            selected={selectedSlotKey === "heroBanner"}
            onSelect={(anchorEl) => onSelectSlot("heroBanner", anchorEl)}
            className="h-full w-full overflow-hidden block"
          >
            <LeftBanner spec={layout.heroBanner} className="h-full w-full" />
          </EditableSlot>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative overflow-visible rounded-xl">
            <EditableSlot
              slotKey="bottomActionBannerLeft"
              selected={selectedSlotKey === "bottomActionBannerLeft"}
              onSelect={(anchorEl) => onSelectSlot("bottomActionBannerLeft", anchorEl)}
              className="h-full w-full block"
            >
              <ActionBanner spec={layout.bottomActionBannerLeft} />
            </EditableSlot>
          </div>
          <div className="relative overflow-visible rounded-xl">
            <EditableSlot
              slotKey="bottomActionBannerRight"
              selected={selectedSlotKey === "bottomActionBannerRight"}
              onSelect={(anchorEl) => onSelectSlot("bottomActionBannerRight", anchorEl)}
              className="h-full w-full block"
            >
              <ActionBanner spec={layout.bottomActionBannerRight} />
            </EditableSlot>
          </div>
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
  onDeselectSlot,
  onChangeSelectedSlot,
  onDeviceChange,
  useSidePanel = true,
}: Props) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const frame = useMemo(() => getFrameByDevice(device), [device]);
  const panelOpenScaleFactor = useSidePanel && !isPanelCollapsed ? 0.9 : 1;
  const scale = useMemo(() => {
    if (!viewportWidth) return 1;
    const fitScale = Math.min(1, viewportWidth / frame.width);
    return fitScale * panelOpenScaleFactor;
  }, [frame.width, viewportWidth, panelOpenScaleFactor]);

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

  const layouts = useMemo(() => {
    if (!slide) return null;
    return makeLayoutsSafe(mapHeroSlideToLayoutsForEditor(slide));
  }, [slide]);

  const selectedSlot = useMemo(() => {
    if (!slide || selectedSlotKey === null) return null;
    if (device === "desktop") return slide.devices.desktop.slots[selectedSlotKey as HeroDesktopSlotKey] || null;
    if (device === "tablet") return slide.devices.tablet.slots[selectedSlotKey as HeroTabletSlotKey] || null;
    return slide.devices.mobile.slots[selectedSlotKey as HeroMobileSlotKey] || null;
  }, [device, selectedSlotKey, slide]);

  const handleSlotSelect = (slotKey: SlotKey) => {
    onSelectSlot(slotKey);
  };

  const deviceLabel = device === "desktop" ? "دسکتاپ" : device === "tablet" ? "تبلت" : "موبایل";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-800">پیش‌نمایش قالب</h2>
        <div className="flex items-center gap-2">
          {onDeviceChange ? (
            (["desktop", "tablet", "mobile"] as DeviceMode[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDeviceChange(d)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  device === d
                    ? "bg-pink-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {d === "desktop" ? "دسکتاپ" : d === "tablet" ? "تبلت" : "موبایل"}
              </button>
            ))
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {deviceLabel}
            </span>
          )}
          {slide && layouts && selectedSlotKey !== null && (
            <span className="rounded-lg bg-pink-50 px-2.5 py-1 text-[11px] font-medium text-pink-700">
              در حال ویرایش: {slotLabelMap[selectedSlotKey] ?? "اسلات"}
            </span>
          )}
          {useSidePanel && (
            <button
              type="button"
              onClick={() => setIsPanelCollapsed((prev) => !prev)}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              title={isPanelCollapsed ? "نمایش پنل ویرایش" : "بستن پنل ویرایش"}
              aria-label={isPanelCollapsed ? "نمایش پنل ویرایش" : "بستن پنل ویرایش"}
            >
              {isPanelCollapsed ? (
                <PanelRight className="h-4 w-4" aria-hidden />
              ) : (
                <PanelLeftClose className="h-4 w-4" aria-hidden />
              )}
            </button>
          )}
        </div>
      </div>

      {!slide || !layouts ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 px-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <Pencil className="h-8 w-8 text-slate-400" aria-hidden />
          </div>
          <p className="mb-2 text-sm font-medium text-slate-700">هنوز اسلایدی وجود ندارد</p>
          <p className="max-w-sm text-xs text-slate-500">
            برای شروع، از دکمه «افزودن اسلاید» در بالا یک اسلاید جدید اضافه کنید.
          </p>
        </div>
      ) : (
        <div
          ref={previewRef}
          className={`flex flex-col gap-4 overflow-x-hidden ${useSidePanel ? "xl:flex-row" : ""}`}
        >
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm font-medium text-slate-600">
              پیش‌نمایش زنده — روی هر بخش کلیک کنید تا ویرایش شود
            </p>

            <div
              ref={viewportRef}
              className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  </div>
                  <div className="flex-1 rounded-md bg-white px-3 py-1.5 text-[11px] text-slate-400">
                    infinitycolor.co
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 justify-center overflow-hidden">
                  <div
                    className="shrink-0 overflow-hidden transition-[width,height] duration-300 ease-out"
                  style={{
                    width: frame.width * scale,
                    height: frame.height * scale,
                  }}
                >
                  <div
                    className="transition-transform duration-300 ease-out"
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
                        selectedSlotKey={selectedSlotKey ?? HERO_DESKTOP_SLOT_KEYS[0]}
                        onSelectSlot={handleSlotSelect}
                      />
                    ) : null}

                    {device === "tablet" ? (
                      <TabletCanvas
                        layouts={layouts}
                        selectedSlotKey={selectedSlotKey ?? HERO_TABLET_SLOT_KEYS[0]}
                        onSelectSlot={handleSlotSelect}
                      />
                    ) : null}

                    {device === "mobile" ? (
                      <MobileCanvas
                        layouts={layouts}
                        selectedSlotKey={selectedSlotKey ?? HERO_MOBILE_SLOT_KEYS[0]}
                        onSelectSlot={handleSlotSelect}
                      />
                    ) : null}
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>

          {useSidePanel ? (
            <motion.div
              className="flex flex-shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white xl:min-h-[400px]"
              initial={false}
              animate={{
                width: isPanelCollapsed ? 0 : 320,
                opacity: isPanelCollapsed ? 0 : 1,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
              }}
              style={{ minWidth: 0 }}
            >
              <div className="w-[320px] shrink-0">
                {selectedSlot && onDeselectSlot ? (
                  <div className="flex h-full min-h-[320px] flex-col overflow-hidden p-3 xl:max-h-[min(70vh,680px)]">
                    <SlotEditorContent
                      slot={selectedSlot}
                      onChange={onChangeSelectedSlot}
                      onClose={onDeselectSlot}
                    />
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                    <p className="text-sm text-slate-500">یک بخش را برای ویرایش انتخاب کنید</p>
                  </div>
                )}
              </div>
            </motion.div>
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
