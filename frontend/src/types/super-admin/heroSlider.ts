export const HERO_SLIDER_VERSION = 1 as const;
export const HERO_SCHEDULE_TIMEZONE = "Asia/Tehran" as const;

export const HERO_DESKTOP_SLOT_KEYS = [
  "topLeftTextBanner",
  "bottomActionBannerLeft",
  "bottomActionBannerRight",
  "rightBanner",
] as const;

export const HERO_TABLET_SLOT_KEYS = [
  "primaryBanner",
  "bottomActionBannerLeft",
  "bottomActionBannerRight",
  "heroBanner",
] as const;

export const HERO_MOBILE_SLOT_KEYS = [
  "primaryBanner",
  "bottomActionBannerLeft",
  "bottomActionBannerRight",
  "heroBanner",
] as const;

export type HeroDesktopSlotKey = (typeof HERO_DESKTOP_SLOT_KEYS)[number];
export type HeroTabletSlotKey = (typeof HERO_TABLET_SLOT_KEYS)[number];
export type HeroMobileSlotKey = (typeof HERO_MOBILE_SLOT_KEYS)[number];

export type HeroLinkType = "internal" | "external";
export type HeroContentAlignment = "top" | "center" | "bottom";
export type HeroBackgroundType = "color" | "image";

export const HERO_FONT_FAMILY_OPTIONS = [
  { value: "font-kaghaz", label: "کاغذ" },
  { value: "font-rokh", label: "رخ" },
  { value: "font-peyda", label: "پیدا" },
  { value: "font-peyda-fanum", label: "پیدا (اعداد فارسی)" },
] as const;

export const HERO_FONT_SIZE_OPTIONS = [
  { value: "text-xs", label: "خیلی کوچک" },
  { value: "text-sm", label: "کوچک" },
  { value: "text-base", label: "متوسط" },
  { value: "text-[26px]", label: "۲۶ پیکسل" },
  { value: "text-lg", label: "بزرگ" },
  { value: "text-lg sm:text-2xl", label: "کارت واکنش‌گرا" },
  { value: "text-xl", label: "خیلی بزرگ" },
  { value: "text-xs sm:text-sm", label: "ریز واکنش‌گرا" },
  { value: "text-2xl", label: "درشت" },
  { value: "text-3xl", label: "نمایشی" },
  { value: "sl:text-[65px] text-[40px]", label: "تیتر ویژه تبلت" },
  { value: "sl:text-[40px] text-xl", label: "زیرتیتر ویژه تبلت" },
  { value: "lg:text-[24px] 2xl:text-[28px]", label: "نمایشی تبلت" },
  { value: "lg:text-[40px] 2xl:text-[48px]", label: "تیتر تبلت" },
  { value: "lg:text-[44px] 2xl:text-[54px]", label: "تیتر دسکتاپ" },
  { value: "text-xl sm:text-2xl md:text-3xl", label: "تیتر موبایل" },
  { value: "text-sm sm:text-base md:text-lg", label: "زیرتیتر موبایل" },
  { value: "lg:text-[30px] 2xl:text-[34px]", label: "زیرتیتر دسکتاپ" },
  { value: "lg:text-[48px] 2xl:text-[50px]", label: "تیتر سفارشی دسکتاپ" },
  { value: "lg:text-[26px] 2xl:text-[30px]", label: "زیرتیتر سفارشی دسکتاپ" },
  { value: "text-[30px]", label: "تیتر کارت سفارشی" },
  { value: "text-[20px]", label: "دکمه سفارشی" },
] as const;

/** Human-friendly size labels (xs → 3xl) for font size dropdown. Keys are HeroFontSizeToken values. */
export const HERO_FONT_SIZE_DISPLAY_LABELS: Record<string, string> = {
  "text-xs": "xs — خیلی کوچک",
  "text-sm": "sm — کوچک",
  "text-base": "md — متوسط",
  "text-lg": "lg — بزرگ",
  "text-xl": "xl — خیلی بزرگ",
  "text-2xl": "2xl — درشت",
  "text-3xl": "3xl — نمایشی",
  "text-[26px]": "۲۶px",
  "text-lg sm:text-2xl": "کارت واکنش‌گرا",
  "text-xs sm:text-sm": "ریز واکنش‌گرا",
  "sl:text-[65px] text-[40px]": "تیتر ویژه تبلت",
  "sl:text-[40px] text-xl": "زیرتیتر ویژه تبلت",
  "lg:text-[24px] 2xl:text-[28px]": "نمایشی تبلت",
  "lg:text-[40px] 2xl:text-[48px]": "تیتر تبلت",
  "lg:text-[44px] 2xl:text-[54px]": "تیتر دسکتاپ",
  "text-xl sm:text-2xl md:text-3xl": "تیتر موبایل",
  "text-sm sm:text-base md:text-lg": "زیرتیتر موبایل",
  "lg:text-[30px] 2xl:text-[34px]": "زیرتیتر دسکتاپ",
  "lg:text-[48px] 2xl:text-[50px]": "تیتر سفارشی دسکتاپ",
  "lg:text-[26px] 2xl:text-[30px]": "زیرتیتر سفارشی دسکتاپ",
  "text-[30px]": "تیتر کارت سفارشی",
  "text-[20px]": "دکمه سفارشی",
};

/** Basic size options (xs–3xl) for primary dropdown; responsive options in "پیشرفته" group. */
export const HERO_FONT_SIZE_BASIC_OPTIONS = [
  { value: "text-xs", label: "xs — خیلی کوچک" },
  { value: "text-sm", label: "sm — کوچک" },
  { value: "text-base", label: "md — متوسط" },
  { value: "text-lg", label: "lg — بزرگ" },
  { value: "text-xl", label: "xl — خیلی بزرگ" },
  { value: "text-2xl", label: "2xl — درشت" },
  { value: "text-3xl", label: "3xl — نمایشی" },
] as const;

export function getFontSizeDisplayLabel(token: string): string {
  return HERO_FONT_SIZE_DISPLAY_LABELS[token] ?? token;
}

export const HERO_FONT_WEIGHT_OPTIONS = [
  { value: "font-normal", label: "معمولی" },
  { value: "font-medium", label: "متوسط" },
  { value: "font-semibold", label: "نیمه‌بولد" },
  { value: "font-bold", label: "بولد" },
  { value: "font-extrabold", label: "خیلی بولد" },
] as const;

export const HERO_LINE_HEIGHT_OPTIONS = [
  { value: "leading-tight", label: "فشرده" },
  { value: "leading-snug", label: "نیمه‌فشرده" },
  { value: "leading-normal", label: "معمولی" },
  { value: "leading-relaxed", label: "باز" },
  { value: "leading-[110%]", label: "۱۱۰٪" },
  { value: "leading-[150%]", label: "۱۵۰٪" },
] as const;

export const HERO_LETTER_SPACING_OPTIONS = [
  { value: "tracking-tight", label: "فشرده" },
  { value: "tracking-normal", label: "معمولی" },
  { value: "tracking-wide", label: "باز" },
] as const;

export type HeroFontFamilyToken = (typeof HERO_FONT_FAMILY_OPTIONS)[number]["value"];
export type HeroFontSizeToken = (typeof HERO_FONT_SIZE_OPTIONS)[number]["value"];
export type HeroFontWeightToken = (typeof HERO_FONT_WEIGHT_OPTIONS)[number]["value"];
export type HeroLineHeightToken = (typeof HERO_LINE_HEIGHT_OPTIONS)[number]["value"];
export type HeroLetterSpacingToken = (typeof HERO_LETTER_SPACING_OPTIONS)[number]["value"];

export type HeroTracking = {
  campaign: string;
  source: string;
  medium: string;
  content: string;
  custom: Record<string, string>;
};

export type HeroSlotLink = {
  type: HeroLinkType;
  href: string;
};

export type HeroTextStyle = {
  color: string;
  fontFamily: HeroFontFamilyToken;
  fontSize: HeroFontSizeToken;
  fontWeight: HeroFontWeightToken;
  lineHeight: HeroLineHeightToken;
  letterSpacing: HeroLetterSpacingToken;
};

export type HeroHeadlineSlot = {
  kind: "headline";
  title: string;
  subtitle: string;
  backgroundColor: string;
  bottomMarginPx: number;
  className: string;
  titleClassName: string;
  subtitleClassName: string;
  titleStyle: HeroTextStyle;
  subtitleStyle: HeroTextStyle;
  link: HeroSlotLink | null;
  tracking: HeroTracking;
};

export type HeroMainVisualSlot = {
  kind: "mainVisual";
  backgroundColor: string;
  backgroundType: HeroBackgroundType;
  backgroundImageUrl: string;
  backgroundWidth: string;
  backgroundHeight: string;
  backgroundPosition: string;
  backgroundSize: string;
  backgroundClassName: string;
  foregroundImageUrl: string;
  foregroundAlt: string;
  foregroundClassName: string;
  foregroundObjectPosition: string;
  foregroundCustomWidth: string;
  foregroundCustomHeight: string;
  /** Foreground image zoom (0.5–2). Default 1. */
  foregroundZoom?: number;
  link: HeroSlotLink | null;
  tracking: HeroTracking;
};

/** Preset options for background size (main visual and cards). */
export const HERO_BACKGROUND_SIZE_PRESETS = [
  { value: "cover", label: "پوشش (Cover)" },
  { value: "contain", label: "دربرگیر (Contain)" },
  { value: "100% 100%", label: "کشیده" },
  { value: "auto", label: "خودکار" },
] as const;

/** Preset options for background position (main visual and cards). */
export const HERO_BACKGROUND_POSITION_PRESETS = [
  { value: "center", label: "وسط" },
  { value: "bottom center", label: "پایین وسط" },
  { value: "top center", label: "بالا وسط" },
  { value: "top left", label: "بالا چپ" },
  { value: "top right", label: "بالا راست" },
  { value: "bottom left", label: "پایین چپ" },
  { value: "bottom right", label: "پایین راست" },
  { value: "center left", label: "وسط چپ" },
  { value: "center right", label: "وسط راست" },
] as const;

export type HeroCardSlot = {
  kind: "card";
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  imageHref: string;
  imageClassName: string;
  imageObjectPosition: string;
  imageCustomWidth: string;
  imageCustomHeight: string;
  buttonLabel: string;
  buttonHref: string;
  buttonClassName: string;
  buttonShowArrow: boolean;
  buttonArrowClassName: string;
  backgroundColor: string;
  backgroundType: HeroBackgroundType;
  backgroundImageUrl: string;
  backgroundWidth: string;
  backgroundHeight: string;
  backgroundPosition: string;
  backgroundSize: string;
  backgroundClassName: string;
  className: string;
  titleClassName: string;
  subtitleClassName: string;
  contentAlignment: HeroContentAlignment;
  paddingClassName: string;
  titleStyle: HeroTextStyle;
  buttonStyle: HeroTextStyle;
  link: HeroSlotLink | null;
  tracking: HeroTracking;
};

export type HeroDesktopSlots = {
  topLeftTextBanner: HeroHeadlineSlot;
  bottomActionBannerLeft: HeroCardSlot;
  bottomActionBannerRight: HeroCardSlot;
  rightBanner: HeroMainVisualSlot;
};

export type HeroTabletSlots = {
  primaryBanner: HeroHeadlineSlot;
  bottomActionBannerLeft: HeroCardSlot;
  bottomActionBannerRight: HeroCardSlot;
  heroBanner: HeroMainVisualSlot;
};

export type HeroMobileSlots = {
  primaryBanner: HeroHeadlineSlot;
  bottomActionBannerLeft: HeroCardSlot;
  bottomActionBannerRight: HeroCardSlot;
  heroBanner: HeroMainVisualSlot;
};

export type HeroSlotConfig = HeroHeadlineSlot | HeroMainVisualSlot | HeroCardSlot;

export type HeroSlideSchedule = {
  timezone: typeof HERO_SCHEDULE_TIMEZONE;
  startAtUtc?: string;
  endAtUtc?: string;
};

export type HeroSlideDevices = {
  desktop: {
    slots: HeroDesktopSlots;
  };
  tablet: {
    slots: HeroTabletSlots;
  };
  mobile: {
    slots: HeroMobileSlots;
  };
};

export type HeroSlideConfig = {
  id: string;
  isActive: boolean;
  autoplayEligible: boolean;
  order: number;
  schedule: HeroSlideSchedule;
  tracking: HeroTracking;
  devices: HeroSlideDevices;
};

export type HeroSliderPayload = {
  version: typeof HERO_SLIDER_VERSION;
  autoplayIntervalMs: number;
  slides: HeroSlideConfig[];
};

export type HeroSliderMeta = {
  version: typeof HERO_SLIDER_VERSION;
  publishedAt: string;
  publishedBy: number | null;
};

const DEFAULT_AUTOPLAY_INTERVAL_MS = 600000;
const MIN_AUTOPLAY_INTERVAL_MS = 3000;
const MAX_AUTOPLAY_INTERVAL_MS = 3600000;
const MIN_HEADLINE_BOTTOM_MARGIN_PX = 0;
const MAX_HEADLINE_BOTTOM_MARGIN_PX = 160;

const ALLOWED_LINK_TYPES = new Set<HeroLinkType>(["internal", "external"]);
const ALLOWED_CONTENT_ALIGNMENTS = new Set<HeroContentAlignment>(["top", "center", "bottom"]);
const ALLOWED_BACKGROUND_TYPES = new Set<HeroBackgroundType>(["color", "image"]);
const ALLOWED_FONT_FAMILIES = new Set<HeroFontFamilyToken>(
  HERO_FONT_FAMILY_OPTIONS.map((item) => item.value),
);
const ALLOWED_FONT_SIZES = new Set<HeroFontSizeToken>(
  HERO_FONT_SIZE_OPTIONS.map((item) => item.value),
);
const ALLOWED_FONT_WEIGHTS = new Set<HeroFontWeightToken>(
  HERO_FONT_WEIGHT_OPTIONS.map((item) => item.value),
);
const ALLOWED_LINE_HEIGHTS = new Set<HeroLineHeightToken>(
  HERO_LINE_HEIGHT_OPTIONS.map((item) => item.value),
);
const ALLOWED_LETTER_SPACINGS = new Set<HeroLetterSpacingToken>(
  HERO_LETTER_SPACING_OPTIONS.map((item) => item.value),
);

const DEFAULT_TOP_HEADLINE_TITLE_STYLE: HeroTextStyle = {
  color: "#94B5D2",
  fontFamily: "font-kaghaz",
  fontSize: "lg:text-[48px] 2xl:text-[50px]",
  fontWeight: "font-bold",
  lineHeight: "leading-tight",
  letterSpacing: "tracking-tight",
};

const DEFAULT_TOP_HEADLINE_SUBTITLE_STYLE: HeroTextStyle = {
  color: "text-gray-600",
  fontFamily: "font-kaghaz",
  fontSize: "lg:text-[26px] 2xl:text-[30px]",
  fontWeight: "font-semibold",
  lineHeight: "leading-relaxed",
  letterSpacing: "tracking-normal",
};

const DEFAULT_PRIMARY_TITLE_STYLE: HeroTextStyle = {
  color: "text-gray-900",
  fontFamily: "font-kaghaz",
  fontSize: "text-xl sm:text-2xl md:text-3xl",
  fontWeight: "font-bold",
  lineHeight: "leading-tight",
  letterSpacing: "tracking-normal",
};

const DEFAULT_PRIMARY_SUBTITLE_STYLE: HeroTextStyle = {
  color: "text-gray-600",
  fontFamily: "font-kaghaz",
  fontSize: "text-sm sm:text-base md:text-lg",
  fontWeight: "font-medium",
  lineHeight: "leading-relaxed",
  letterSpacing: "tracking-normal",
};

const DEFAULT_CARD_TITLE_STYLE: HeroTextStyle = {
  color: "text-gray-900",
  fontFamily: "font-peyda-fanum",
  fontSize: "text-lg",
  fontWeight: "font-bold",
  lineHeight: "leading-tight",
  letterSpacing: "tracking-normal",
};

const DEFAULT_CARD_BUTTON_STYLE: HeroTextStyle = {
  color: "text-white",
  fontFamily: "font-peyda-fanum",
  fontSize: "text-sm",
  fontWeight: "font-medium",
  lineHeight: "leading-normal",
  letterSpacing: "tracking-normal",
};

const DEFAULT_DESKTOP_HEADLINE_CLASSNAME =
  "w-full gap-[8px] pb-[68px] mb-[10px] rounded-3xl px-[36px] pt-[30px]";
const DEFAULT_TABLET_HEADLINE_CLASSNAME =
  "w-full gap-[8px] rounded-3xl px-[24px] pb-[40px] pt-[20px]";
const DEFAULT_MOBILE_HEADLINE_CLASSNAME =
  "w-full gap-[8px] rounded-3xl px-[24px] pb-[24px] pt-[20px]";

const DEFAULT_DESKTOP_CARD_LEFT_CLASSNAME = "h-[80%]";
const DEFAULT_DESKTOP_CARD_RIGHT_CLASSNAME = "h-[80%]";
const DEFAULT_DESKTOP_CARD_LEFT_IMAGE_CLASSNAME =
  "h-full w-full rounded-lg mb-2 -translate-y-4 object-contain";
const DEFAULT_DESKTOP_CARD_RIGHT_IMAGE_CLASSNAME =
  "h-full w-full rounded-lg pl-2 object-contain";
const DEFAULT_CARD_BACKGROUND_CLASSNAME = "rounded-3xl";
const DEFAULT_CARD_BUTTON_CLASSNAME = "text-white text-[20px] font-normal rounded-lg";
const DEFAULT_CARD_PADDING_CLASSNAME = "px-4 py-4 pr-8";

const DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_WIDTH = "520px";
const DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_HEIGHT = "427px";
const DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_POSITION = "bottom center";
const DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_SIZE = "cover";
const DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_CLASSNAME = "rounded-3xl";

const DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_WIDTH = "100%";
const DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_HEIGHT = "80%";
const DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_POSITION = "bottom center";
const DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_SIZE = "cover";
const DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_CLASSNAME = "rounded-lg";
const DEFAULT_TABLET_MAIN_VISUAL_FOREGROUND_CLASSNAME =
  "object-contain w-[99%] scale-125 h-[99%] translate-y-8";
const DEFAULT_TABLET_MAIN_VISUAL_FOREGROUND_POSITION = "bottom center";

const DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_WIDTH = "100%";
const DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_HEIGHT = "80%";
const DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_POSITION = "bottom center";
const DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_SIZE = "cover";
const DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_CLASSNAME = "rounded-lg";
const DEFAULT_MOBILE_MAIN_VISUAL_FOREGROUND_CLASSNAME =
  "object-contain w-[99%] scale-125 h-[99%] translate-y-8";
const DEFAULT_MOBILE_MAIN_VISUAL_FOREGROUND_POSITION = "bottom center";

const DEFAULT_TABLET_CARD_LEFT_CLASSNAME = "min-h-[120px] tablet:min-h-[140px] sl:min-h-[150px] rounded-xl";
const DEFAULT_TABLET_CARD_RIGHT_CLASSNAME = "min-h-[120px] tablet:min-h-[140px] sl:min-h-[150px] rounded-xl";
const DEFAULT_TABLET_CARD_LEFT_IMAGE_CLASSNAME =
  "h-full w-full rounded-lg mb-2 scale-150 translate-x-4 -translate-y-4 object-contain";
const DEFAULT_TABLET_CARD_RIGHT_IMAGE_CLASSNAME =
  "h-full w-full rounded-lg scale-125 -translate-y-4 pl-5 object-contain";

const DEFAULT_MOBILE_CARD_LEFT_CLASSNAME = "rounded-lg";
const DEFAULT_MOBILE_CARD_RIGHT_CLASSNAME = "rounded-lg";
const DEFAULT_MOBILE_CARD_LEFT_IMAGE_CLASSNAME =
  "h-full w-full rounded-lg mb-2 scale-150 -translate-y-4 object-contain";
const DEFAULT_MOBILE_CARD_RIGHT_IMAGE_CLASSNAME =
  "h-full w-full rounded-lg scale-125 pl-2 object-contain";
const DEFAULT_MOBILE_CARD_PADDING_CLASSNAME = "px-3 py-4 pr-3";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeString(value: unknown, maxLength = 280): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  if (num < min) return min;
  if (num > max) return max;
  return num;
}

function sanitizeImageUrl(value: unknown): string {
  const normalized = sanitizeString(value, 2048);
  if (!normalized) return "";

  if (normalized.startsWith("/")) return normalized;
  if (/^https?:\/\//i.test(normalized)) return normalized;

  return "";
}

function sanitizeDateIso(value: unknown): string | undefined {
  const normalized = sanitizeString(value, 128);
  if (!normalized) return undefined;

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed.toISOString();
}

function sanitizeColorOrClass(value: unknown): string {
  const normalized = sanitizeString(value, 120);
  if (!normalized) return "";

  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(normalized)) {
    return normalized;
  }

  if (/^(rgba?|hsla?)\([^)]*\)$/i.test(normalized)) {
    return normalized;
  }

  if (/^(text|bg)-[a-z0-9:/\-[\].]+$/i.test(normalized)) {
    return normalized;
  }

  return "";
}

function sanitizeClassName(value: unknown, maxLength = 280): string {
  return sanitizeString(value, maxLength);
}

function sanitizeToken<T extends string>(
  value: unknown,
  allowed: Set<T>,
  fallback: T,
): T {
  const normalized = sanitizeString(value, 120);
  if (!normalized) return fallback;
  return allowed.has(normalized as T) ? (normalized as T) : fallback;
}

function sanitizeHref(value: unknown): string {
  const href = sanitizeString(value, 2048);
  if (!href) return "";
  if (href.startsWith("/")) return href;
  if (/^https?:\/\//i.test(href)) return href;
  return "";
}

function createDefaultTracking(): HeroTracking {
  return {
    campaign: "",
    source: "",
    medium: "",
    content: "",
    custom: {},
  };
}

export function normalizeHeroTracking(value: unknown): HeroTracking {
  if (!isRecord(value)) return createDefaultTracking();

  const customRaw = isRecord(value.custom) ? value.custom : {};
  const custom: Record<string, string> = {};
  Object.entries(customRaw).forEach(([key, raw]) => {
    const normalizedKey = sanitizeString(key, 64);
    const normalizedValue = sanitizeString(raw, 256);
    if (!normalizedKey || !normalizedValue) return;
    custom[normalizedKey] = normalizedValue;
  });

  return {
    campaign: sanitizeString(value.campaign),
    source: sanitizeString(value.source),
    medium: sanitizeString(value.medium),
    content: sanitizeString(value.content),
    custom,
  };
}

function sanitizeSlotLink(value: unknown): HeroSlotLink | null {
  if (!isRecord(value)) return null;

  const type = sanitizeToken(value.type, ALLOWED_LINK_TYPES, "internal");
  const href = sanitizeString(value.href, 2048);
  if (!href) return null;

  if (type === "internal" && href.startsWith("/")) {
    return { type, href };
  }

  if (type === "external" && /^https?:\/\//i.test(href)) {
    return { type, href };
  }

  return null;
}

function sanitizeTextStyle(
  value: unknown,
  defaults: HeroTextStyle,
  legacyColor?: unknown,
  legacyTypography?: Record<string, unknown> | null,
  fieldPrefix?: "title" | "subtitle",
): HeroTextStyle {
  const raw = isRecord(value) ? value : {};

  const legacyFont = fieldPrefix ? legacyTypography?.[`${fieldPrefix}Font`] : undefined;
  const legacySize = fieldPrefix ? legacyTypography?.[`${fieldPrefix}Size`] : undefined;
  const legacyWeight = fieldPrefix ? legacyTypography?.[`${fieldPrefix}Weight`] : undefined;
  const legacyLineHeight = fieldPrefix ? legacyTypography?.[`${fieldPrefix}Leading`] : undefined;
  const legacyTracking = fieldPrefix ? legacyTypography?.[`${fieldPrefix}Tracking`] : undefined;

  return {
    color: sanitizeColorOrClass(raw.color ?? legacyColor) || defaults.color,
    fontFamily: sanitizeToken(raw.fontFamily ?? legacyFont, ALLOWED_FONT_FAMILIES, defaults.fontFamily),
    fontSize: sanitizeToken(raw.fontSize ?? legacySize, ALLOWED_FONT_SIZES, defaults.fontSize),
    fontWeight: sanitizeToken(raw.fontWeight ?? legacyWeight, ALLOWED_FONT_WEIGHTS, defaults.fontWeight),
    lineHeight: sanitizeToken(raw.lineHeight ?? legacyLineHeight, ALLOWED_LINE_HEIGHTS, defaults.lineHeight),
    letterSpacing: sanitizeToken(
      raw.letterSpacing ?? legacyTracking,
      ALLOWED_LETTER_SPACINGS,
      defaults.letterSpacing,
    ),
  };
}

function normalizeHeadlineSlot(
  value: unknown,
  defaults: {
    titleStyle: HeroTextStyle;
    subtitleStyle: HeroTextStyle;
    backgroundColor: string;
    bottomMarginPx: number;
    className: string;
    titleClassName: string;
    subtitleClassName: string;
  },
): HeroHeadlineSlot {
  const raw = isRecord(value) ? value : {};
  const style = isRecord(raw.style) ? raw.style : {};
  const colors = isRecord(raw.colors) ? raw.colors : {};
  const typography = isRecord(raw.typography) ? raw.typography : null;

  return {
    kind: "headline",
    title: sanitizeString(raw.title),
    subtitle: sanitizeString(raw.subtitle),
    backgroundColor:
      sanitizeColorOrClass(raw.backgroundColor ?? style.backgroundColor ?? colors.background) ||
      defaults.backgroundColor,
    bottomMarginPx: clamp(
      raw.bottomMarginPx ?? style.bottomMarginPx,
      MIN_HEADLINE_BOTTOM_MARGIN_PX,
      MAX_HEADLINE_BOTTOM_MARGIN_PX,
      defaults.bottomMarginPx,
    ),
    className: sanitizeClassName(raw.className ?? style.className) || defaults.className,
    titleClassName: sanitizeClassName(raw.titleClassName ?? style.titleClassName) || defaults.titleClassName,
    subtitleClassName:
      sanitizeClassName(raw.subtitleClassName ?? style.subtitleClassName) || defaults.subtitleClassName,
    titleStyle: sanitizeTextStyle(
      raw.titleStyle,
      defaults.titleStyle,
      colors.titleColor,
      typography,
      "title",
    ),
    subtitleStyle: sanitizeTextStyle(
      raw.subtitleStyle,
      defaults.subtitleStyle,
      colors.subtitleColor,
      typography,
      "subtitle",
    ),
    link: sanitizeSlotLink(raw.link),
    tracking: normalizeHeroTracking(raw.tracking),
  };
}

function normalizeMainVisualSlot(
  value: unknown,
  defaults?: {
    backgroundImageUrl?: string;
    backgroundWidth?: string;
    backgroundHeight?: string;
    backgroundPosition?: string;
    backgroundSize?: string;
    backgroundClassName?: string;
    foregroundImageUrl?: string;
    foregroundClassName?: string;
    foregroundObjectPosition?: string;
  },
): HeroMainVisualSlot {
  const raw = isRecord(value) ? value : {};
  const style = isRecord(raw.style) ? raw.style : {};
  const media = isRecord(raw.media) ? raw.media : {};

  const backgroundImageUrl =
    sanitizeImageUrl(raw.backgroundImageUrl ?? style.backgroundImageUrl) ||
    defaults?.backgroundImageUrl ||
    "";
  const backgroundColor = sanitizeColorOrClass(raw.backgroundColor ?? style.backgroundColor);
  const explicitBackgroundType = sanitizeToken(
    raw.backgroundType ?? style.backgroundType,
    ALLOWED_BACKGROUND_TYPES,
    backgroundImageUrl ? "image" : "color",
  );

  return {
    kind: "mainVisual",
    backgroundColor,
    backgroundType: explicitBackgroundType,
    backgroundImageUrl,
    backgroundWidth: sanitizeClassName(raw.backgroundWidth ?? style.backgroundWidth, 80) || defaults?.backgroundWidth || "",
    backgroundHeight:
      sanitizeClassName(raw.backgroundHeight ?? style.backgroundHeight, 80) || defaults?.backgroundHeight || "",
    backgroundPosition:
      sanitizeClassName(raw.backgroundPosition ?? style.backgroundPosition, 80) ||
      defaults?.backgroundPosition ||
      "center",
    backgroundSize:
      sanitizeClassName(raw.backgroundSize ?? style.backgroundSize, 80) ||
      defaults?.backgroundSize ||
      "cover",
    backgroundClassName:
      sanitizeClassName(raw.backgroundClassName ?? style.backgroundClassName, 180) ||
      defaults?.backgroundClassName ||
      "",
    foregroundImageUrl:
      sanitizeImageUrl(raw.foregroundImageUrl ?? media.imageUrl) ||
      defaults?.foregroundImageUrl ||
      "",
    foregroundAlt: sanitizeString(raw.foregroundAlt ?? media.alt, 140),
    foregroundClassName:
      sanitizeClassName(raw.foregroundClassName ?? media.className, 180) || defaults?.foregroundClassName || "",
    foregroundObjectPosition:
      sanitizeClassName(raw.foregroundObjectPosition ?? media.objectPosition, 80) ||
      defaults?.foregroundObjectPosition ||
      "",
    foregroundCustomWidth: sanitizeClassName(raw.foregroundCustomWidth ?? media.customWidth, 80),
    foregroundCustomHeight: sanitizeClassName(raw.foregroundCustomHeight ?? media.customHeight, 80),
    foregroundZoom:
      typeof raw.foregroundZoom === "number" && Number.isFinite(raw.foregroundZoom)
        ? Math.min(2, Math.max(0.5, raw.foregroundZoom))
        : undefined,
    link: sanitizeSlotLink(raw.link),
    tracking: normalizeHeroTracking(raw.tracking),
  };
}

function normalizeCardSlot(
  value: unknown,
  defaults?: {
    imageUrl?: string;
    imageAlt?: string;
    className?: string;
    titleClassName?: string;
    subtitleClassName?: string;
    imageClassName?: string;
    imageObjectPosition?: string;
    backgroundColor?: string;
    backgroundHeight?: string;
    backgroundWidth?: string;
    backgroundPosition?: string;
    backgroundSize?: string;
    backgroundClassName?: string;
    buttonClassName?: string;
    buttonShowArrow?: boolean;
    contentAlignment?: HeroContentAlignment;
    paddingClassName?: string;
    titleStyle?: HeroTextStyle;
    buttonStyle?: HeroTextStyle;
  },
): HeroCardSlot {
  const raw = isRecord(value) ? value : {};
  const style = isRecord(raw.style) ? raw.style : {};
  const media = isRecord(raw.media) ? raw.media : {};
  const colors = isRecord(raw.colors) ? raw.colors : {};
  const typography = isRecord(raw.typography) ? raw.typography : null;
  const link = isRecord(raw.link) ? raw.link : undefined;
  const button = isRecord(raw.button) ? raw.button : undefined;
  const backgroundImageUrl = sanitizeImageUrl(raw.backgroundImageUrl ?? style.backgroundImageUrl);
  const backgroundColor =
    sanitizeColorOrClass(raw.backgroundColor ?? style.backgroundColor ?? colors.background);

  return {
    kind: "card",
    title: sanitizeString(raw.title),
    subtitle: sanitizeString(raw.subtitle),
    imageUrl: sanitizeImageUrl(raw.imageUrl ?? media.imageUrl) || defaults?.imageUrl || "",
    imageAlt: sanitizeString(raw.imageAlt ?? media.alt, 140) || defaults?.imageAlt || "",
    imageHref: sanitizeHref(raw.imageHref ?? media.href),
    imageClassName: sanitizeClassName(raw.imageClassName ?? media.className, 180) || defaults?.imageClassName || "",
    imageObjectPosition:
      sanitizeClassName(raw.imageObjectPosition ?? media.objectPosition, 80) ||
      defaults?.imageObjectPosition ||
      "",
    imageCustomWidth: sanitizeClassName(raw.imageCustomWidth ?? media.customWidth, 80),
    imageCustomHeight: sanitizeClassName(raw.imageCustomHeight ?? media.customHeight, 80),
    buttonLabel: sanitizeString(raw.buttonLabel ?? raw.label, 120),
    buttonHref: sanitizeHref(raw.buttonHref ?? link?.href),
    buttonClassName:
      sanitizeClassName(raw.buttonClassName ?? button?.className, 220) ||
      defaults?.buttonClassName ||
      "",
    buttonShowArrow:
      typeof raw.buttonShowArrow === "boolean"
        ? raw.buttonShowArrow
        : typeof button?.showArrow === "boolean"
          ? button.showArrow
          : (defaults?.buttonShowArrow ?? true),
    buttonArrowClassName: sanitizeClassName(raw.buttonArrowClassName ?? button?.arrowClassName, 180),
    backgroundColor: backgroundColor || defaults?.backgroundColor || "",
    backgroundType: sanitizeToken(
      raw.backgroundType ?? style.backgroundType,
      ALLOWED_BACKGROUND_TYPES,
      backgroundImageUrl ? "image" : "color",
    ),
    backgroundImageUrl,
    backgroundWidth: sanitizeClassName(raw.backgroundWidth ?? style.backgroundWidth, 80) || defaults?.backgroundWidth || "",
    backgroundHeight:
      sanitizeClassName(raw.backgroundHeight ?? style.backgroundHeight, 80) ||
      defaults?.backgroundHeight ||
      "",
    backgroundPosition:
      sanitizeClassName(raw.backgroundPosition ?? style.backgroundPosition, 80) ||
      defaults?.backgroundPosition ||
      "center",
    backgroundSize:
      sanitizeClassName(raw.backgroundSize ?? style.backgroundSize, 80) ||
      defaults?.backgroundSize ||
      "cover",
    backgroundClassName:
      sanitizeClassName(raw.backgroundClassName ?? style.backgroundClassName, 180) ||
      defaults?.backgroundClassName ||
      "",
    className: sanitizeClassName(raw.className ?? style.className, 220) || defaults?.className || "",
    titleClassName:
      sanitizeClassName(raw.titleClassName ?? style.titleClassName, 180) ||
      defaults?.titleClassName ||
      "",
    subtitleClassName:
      sanitizeClassName(raw.subtitleClassName ?? style.subtitleClassName, 180) ||
      defaults?.subtitleClassName ||
      "",
    contentAlignment: sanitizeToken(
      raw.contentAlignment ?? style.contentAlignment,
      ALLOWED_CONTENT_ALIGNMENTS,
      defaults?.contentAlignment || "center",
    ),
    paddingClassName:
      sanitizeClassName(raw.paddingClassName ?? style.paddingClassName, 220) ||
      defaults?.paddingClassName ||
      DEFAULT_CARD_PADDING_CLASSNAME,
    titleStyle: sanitizeTextStyle(
      raw.titleStyle,
      defaults?.titleStyle || DEFAULT_CARD_TITLE_STYLE,
      colors.titleColor,
      typography,
      "title",
    ),
    buttonStyle: sanitizeTextStyle(
      raw.buttonStyle,
      defaults?.buttonStyle || DEFAULT_CARD_BUTTON_STYLE,
    ),
    link: sanitizeSlotLink(raw.link),
    tracking: normalizeHeroTracking(raw.tracking),
  };
}

function normalizeDesktopSlots(rawSlots: unknown): HeroDesktopSlots {
  const slots = isRecord(rawSlots) ? rawSlots : {};

  return {
    topLeftTextBanner: normalizeHeadlineSlot(slots.topLeftTextBanner, {
      titleStyle: DEFAULT_TOP_HEADLINE_TITLE_STYLE,
      subtitleStyle: DEFAULT_TOP_HEADLINE_SUBTITLE_STYLE,
      backgroundColor: "bg-stone-50",
      bottomMarginPx: 0,
      className: DEFAULT_DESKTOP_HEADLINE_CLASSNAME,
      titleClassName: "",
      subtitleClassName: "",
    }),
    bottomActionBannerLeft: normalizeCardSlot(slots.bottomActionBannerLeft, {
      className: DEFAULT_DESKTOP_CARD_LEFT_CLASSNAME,
      titleClassName: "text-[30px] font-medium",
      imageClassName: DEFAULT_DESKTOP_CARD_LEFT_IMAGE_CLASSNAME,
      imageObjectPosition: "top left",
      backgroundWidth: "100%",
      backgroundHeight: "80%",
      backgroundPosition: "bottom center",
      backgroundSize: "cover",
      backgroundClassName: DEFAULT_CARD_BACKGROUND_CLASSNAME,
      buttonClassName: DEFAULT_CARD_BUTTON_CLASSNAME,
      buttonShowArrow: true,
      contentAlignment: "center",
      paddingClassName: DEFAULT_CARD_PADDING_CLASSNAME,
    }),
    bottomActionBannerRight: normalizeCardSlot(slots.bottomActionBannerRight, {
      className: DEFAULT_DESKTOP_CARD_RIGHT_CLASSNAME,
      titleClassName: "text-[30px] font-medium",
      imageClassName: DEFAULT_DESKTOP_CARD_RIGHT_IMAGE_CLASSNAME,
      imageObjectPosition: "left",
      backgroundWidth: "100%",
      backgroundHeight: "80%",
      backgroundPosition: "bottom center",
      backgroundSize: "cover",
      backgroundClassName: DEFAULT_CARD_BACKGROUND_CLASSNAME,
      buttonClassName: DEFAULT_CARD_BUTTON_CLASSNAME,
      buttonShowArrow: true,
      contentAlignment: "center",
      paddingClassName: DEFAULT_CARD_PADDING_CLASSNAME,
    }),
    rightBanner: normalizeMainVisualSlot(slots.rightBanner, {
      backgroundWidth: DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_WIDTH,
      backgroundHeight: DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_HEIGHT,
      backgroundPosition: DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_POSITION,
      backgroundSize: DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_SIZE,
      backgroundClassName: DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_CLASSNAME,
      foregroundClassName: "",
    }),
  };
}

function normalizeTabletSlots(rawSlots: unknown): HeroTabletSlots {
  const slots = isRecord(rawSlots) ? rawSlots : {};

  return {
    primaryBanner: normalizeHeadlineSlot(slots.primaryBanner, {
      titleStyle: {
        ...DEFAULT_PRIMARY_TITLE_STYLE,
        fontSize: "lg:text-[40px] 2xl:text-[48px]",
      },
      subtitleStyle: {
        ...DEFAULT_PRIMARY_SUBTITLE_STYLE,
        fontSize: "lg:text-[24px] 2xl:text-[28px]",
      },
      backgroundColor: "bg-stone-50",
      bottomMarginPx: 0,
      className: DEFAULT_TABLET_HEADLINE_CLASSNAME,
      titleClassName: "",
      subtitleClassName: "",
    }),
    bottomActionBannerLeft: normalizeCardSlot(slots.bottomActionBannerLeft, {
      className: DEFAULT_TABLET_CARD_LEFT_CLASSNAME,
      imageClassName: DEFAULT_TABLET_CARD_LEFT_IMAGE_CLASSNAME,
      imageObjectPosition: "",
      contentAlignment: "center",
    }),
    bottomActionBannerRight: normalizeCardSlot(slots.bottomActionBannerRight, {
      className: DEFAULT_TABLET_CARD_RIGHT_CLASSNAME,
      imageClassName: DEFAULT_TABLET_CARD_RIGHT_IMAGE_CLASSNAME,
      imageObjectPosition: "left",
      contentAlignment: "bottom",
    }),
    heroBanner: normalizeMainVisualSlot(slots.heroBanner, {
      backgroundWidth: DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_WIDTH,
      backgroundHeight: DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_HEIGHT,
      backgroundPosition: DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_POSITION,
      backgroundSize: DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_SIZE,
      backgroundClassName: DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_CLASSNAME,
      foregroundClassName: DEFAULT_TABLET_MAIN_VISUAL_FOREGROUND_CLASSNAME,
      foregroundObjectPosition: DEFAULT_TABLET_MAIN_VISUAL_FOREGROUND_POSITION,
    }),
  };
}

function normalizeMobileSlots(rawSlots: unknown): HeroMobileSlots {
  const slots = isRecord(rawSlots) ? rawSlots : {};

  return {
    primaryBanner: normalizeHeadlineSlot(slots.primaryBanner, {
      titleStyle: DEFAULT_PRIMARY_TITLE_STYLE,
      subtitleStyle: DEFAULT_PRIMARY_SUBTITLE_STYLE,
      backgroundColor: "bg-stone-50",
      bottomMarginPx: 0,
      className: DEFAULT_MOBILE_HEADLINE_CLASSNAME,
      titleClassName: "",
      subtitleClassName: "",
    }),
    bottomActionBannerLeft: normalizeCardSlot(slots.bottomActionBannerLeft, {
      className: DEFAULT_MOBILE_CARD_LEFT_CLASSNAME,
      imageClassName: DEFAULT_MOBILE_CARD_LEFT_IMAGE_CLASSNAME,
      imageObjectPosition: "bottom left",
      contentAlignment: "center",
      paddingClassName: DEFAULT_MOBILE_CARD_PADDING_CLASSNAME,
    }),
    bottomActionBannerRight: normalizeCardSlot(slots.bottomActionBannerRight, {
      className: DEFAULT_MOBILE_CARD_RIGHT_CLASSNAME,
      imageClassName: DEFAULT_MOBILE_CARD_RIGHT_IMAGE_CLASSNAME,
      imageObjectPosition: "left",
      contentAlignment: "center",
      paddingClassName: DEFAULT_MOBILE_CARD_PADDING_CLASSNAME,
    }),
    heroBanner: normalizeMainVisualSlot(slots.heroBanner, {
      backgroundWidth: DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_WIDTH,
      backgroundHeight: DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_HEIGHT,
      backgroundPosition: DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_POSITION,
      backgroundSize: DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_SIZE,
      backgroundClassName: DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_CLASSNAME,
      foregroundClassName: DEFAULT_MOBILE_MAIN_VISUAL_FOREGROUND_CLASSNAME,
      foregroundObjectPosition: DEFAULT_MOBILE_MAIN_VISUAL_FOREGROUND_POSITION,
    }),
  };
}

function normalizeSlideSchedule(value: unknown): HeroSlideSchedule {
  const scheduleRaw = isRecord(value) ? value : {};
  const startAtUtc = sanitizeDateIso(scheduleRaw.startAtUtc);
  const endAtUtc = sanitizeDateIso(scheduleRaw.endAtUtc);

  return {
    timezone: HERO_SCHEDULE_TIMEZONE,
    ...(startAtUtc ? { startAtUtc } : {}),
    ...(endAtUtc ? { endAtUtc } : {}),
  };
}

function normalizeSlide(value: unknown, index: number): HeroSlideConfig {
  const slideRaw = isRecord(value) ? value : {};
  const devicesRaw = isRecord(slideRaw.devices) ? slideRaw.devices : {};

  return {
    id: sanitizeString(slideRaw.id, 80) || `slide-${index + 1}`,
    isActive: typeof slideRaw.isActive === "boolean" ? slideRaw.isActive : true,
    autoplayEligible:
      typeof slideRaw.autoplayEligible === "boolean" ? slideRaw.autoplayEligible : true,
    order: Number.isFinite(Number(slideRaw.order)) ? Number(slideRaw.order) : index,
    schedule: normalizeSlideSchedule(slideRaw.schedule),
    tracking: normalizeHeroTracking(slideRaw.tracking),
    devices: {
      desktop: {
        slots: normalizeDesktopSlots(isRecord(devicesRaw.desktop) ? devicesRaw.desktop.slots : undefined),
      },
      tablet: {
        slots: normalizeTabletSlots(isRecord(devicesRaw.tablet) ? devicesRaw.tablet.slots : undefined),
      },
      mobile: {
        slots: normalizeMobileSlots(isRecord(devicesRaw.mobile) ? devicesRaw.mobile.slots : undefined),
      },
    },
  };
}

export function createDefaultHeroSliderPayload(): HeroSliderPayload {
  return {
    version: HERO_SLIDER_VERSION,
    autoplayIntervalMs: DEFAULT_AUTOPLAY_INTERVAL_MS,
    slides: [],
  };
}

export function normalizeHeroSliderPayload(value: unknown): HeroSliderPayload {
  if (!isRecord(value)) {
    return createDefaultHeroSliderPayload();
  }

  const rawSlides = Array.isArray(value.slides) ? value.slides : [];

  return {
    version: HERO_SLIDER_VERSION,
    autoplayIntervalMs: clamp(
      value.autoplayIntervalMs,
      MIN_AUTOPLAY_INTERVAL_MS,
      MAX_AUTOPLAY_INTERVAL_MS,
      DEFAULT_AUTOPLAY_INTERVAL_MS,
    ),
    slides: rawSlides.map((slide, index) => normalizeSlide(slide, index)),
  };
}

export function normalizeHeroSliderMeta(value: unknown): HeroSliderMeta | null {
  if (!isRecord(value)) return null;

  const publishedAt = sanitizeDateIso(value.publishedAt);
  if (!publishedAt) return null;

  const publishedBy = Number(value.publishedBy);

  return {
    version: HERO_SLIDER_VERSION,
    publishedAt,
    publishedBy: Number.isFinite(publishedBy) ? publishedBy : null,
  };
}

export function isHeroSlideVisible(slide: HeroSlideConfig, now = new Date()): boolean {
  if (!slide.isActive) {
    return false;
  }

  const startAtUtc = slide.schedule.startAtUtc ? new Date(slide.schedule.startAtUtc) : null;
  const endAtUtc = slide.schedule.endAtUtc ? new Date(slide.schedule.endAtUtc) : null;

  if (startAtUtc && !Number.isNaN(startAtUtc.getTime()) && now < startAtUtc) {
    return false;
  }

  if (endAtUtc && !Number.isNaN(endAtUtc.getTime()) && now > endAtUtc) {
    return false;
  }

  return true;
}
