import {
  DEFAULT_AUTOPLAY_INTERVAL_MS,
  MIN_AUTOPLAY_INTERVAL_MS,
  MAX_AUTOPLAY_INTERVAL_MS,
  MIN_HEADLINE_BOTTOM_MARGIN_PX,
  MAX_HEADLINE_BOTTOM_MARGIN_PX,
  MAX_TEXT_LENGTH,
  ALLOWED_LINK_TYPES,
  ALLOWED_CONTENT_ALIGNMENTS,
  ALLOWED_BACKGROUND_TYPES,
  ALLOWED_FONT_FAMILIES,
  ALLOWED_FONT_SIZES,
  ALLOWED_FONT_WEIGHTS,
  ALLOWED_LINE_HEIGHTS,
  ALLOWED_LETTER_SPACINGS,
} from "./hero-slider-defaults";
import {
  DEFAULT_TOP_HEADLINE_TITLE_STYLE,
  DEFAULT_TOP_HEADLINE_SUBTITLE_STYLE,
  DEFAULT_PRIMARY_TITLE_STYLE,
  DEFAULT_PRIMARY_SUBTITLE_STYLE,
  DEFAULT_CARD_TITLE_STYLE,
  DEFAULT_CARD_BUTTON_STYLE,
  DEFAULT_DESKTOP_HEADLINE_CLASSNAME,
  DEFAULT_TABLET_HEADLINE_CLASSNAME,
  DEFAULT_MOBILE_HEADLINE_CLASSNAME,
  DEFAULT_DESKTOP_CARD_LEFT_CLASSNAME,
  DEFAULT_DESKTOP_CARD_RIGHT_CLASSNAME,
  DEFAULT_DESKTOP_CARD_LEFT_IMAGE_CLASSNAME,
  DEFAULT_DESKTOP_CARD_RIGHT_IMAGE_CLASSNAME,
  DEFAULT_CARD_BACKGROUND_CLASSNAME,
  DEFAULT_CARD_BUTTON_CLASSNAME,
  DEFAULT_CARD_PADDING_CLASSNAME,
  DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_WIDTH,
  DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_HEIGHT,
  DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_POSITION,
  DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_SIZE,
  DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_CLASSNAME,
  DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_WIDTH,
  DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_HEIGHT,
  DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_POSITION,
  DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_SIZE,
  DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_CLASSNAME,
  DEFAULT_TABLET_MAIN_VISUAL_FOREGROUND_CLASSNAME,
  DEFAULT_TABLET_MAIN_VISUAL_FOREGROUND_POSITION,
  DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_WIDTH,
  DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_HEIGHT,
  DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_POSITION,
  DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_SIZE,
  DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_CLASSNAME,
  DEFAULT_MOBILE_MAIN_VISUAL_FOREGROUND_CLASSNAME,
  DEFAULT_MOBILE_MAIN_VISUAL_FOREGROUND_POSITION,
  DEFAULT_TABLET_CARD_LEFT_CLASSNAME,
  DEFAULT_TABLET_CARD_RIGHT_CLASSNAME,
  DEFAULT_TABLET_CARD_LEFT_IMAGE_CLASSNAME,
  DEFAULT_TABLET_CARD_RIGHT_IMAGE_CLASSNAME,
  DEFAULT_MOBILE_CARD_LEFT_CLASSNAME,
  DEFAULT_MOBILE_CARD_RIGHT_CLASSNAME,
  DEFAULT_MOBILE_CARD_LEFT_IMAGE_CLASSNAME,
  DEFAULT_MOBILE_CARD_RIGHT_IMAGE_CLASSNAME,
  DEFAULT_MOBILE_CARD_PADDING_CLASSNAME,
  DEFAULT_COMPACT_CARD_BUTTON_CLASSNAME,
  DEFAULT_COMPACT_CARD_BACKGROUND_CLASSNAME,
} from "./hero-slider-default-styles";
import type {
  HeroSlotLink,
  HeroTracking,
  HeroTextStyle,
  HeroHeadlineSlot,
  HeroMainVisualSlot,
  HeroCardSlot,
  HeroSlideSchedule,
  HeroSlideConfig,
  HeroSliderPayload,
  HeroSliderMeta,
  HeroSliderSanitizationResult,
  HeroContentAlignment,
  HeroImageOverflow,
  HeroOverflowEdge,
} from "./hero-slider-types";

const MAX_CUSTOM_ENTRIES = 20;
const MAX_SLIDES = 50;
const DEFAULT_IMAGE_OVERFLOW: HeroImageOverflow = {
  enabled: false,
  edge: "top",
  amountPx: 0,
  offsetXPercent: 50,
  offsetYPercent: 50,
  widthPercent: 100,
};

/** Stricter pattern: rgb/rgba allow only numbers, commas, spaces, optional alpha 0–1. */
const RGB_RGBA_PATTERN =
  /^rgba?\s*\(\s*\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i;
/** Stricter pattern: hsl/hsla allow numbers, optional %, optional deg/rad/turn, commas, spaces, optional alpha. */
const HSL_HSLA_PATTERN =
  /^hsla?\s*\(\s*\d+(?:\.\d+)?(?:deg|rad|turn)?\s*,\s*\d+(?:\.\d+)?%\s*,\s*\d+(?:\.\d+)?%\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  if (num < min) return min;
  if (num > max) return max;
  return num;
}

function sanitizeImageOverflow(value: unknown): HeroImageOverflow {
  const raw = isRecord(value) ? value : {};
  const edgeRaw = sanitizeString(raw.edge, 16);
  const edge: HeroOverflowEdge =
    edgeRaw === "right" || edgeRaw === "bottom" || edgeRaw === "left" ? edgeRaw : "top";

  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : DEFAULT_IMAGE_OVERFLOW.enabled,
    edge,
    amountPx: clampNumber(raw.amountPx, 0, 240, DEFAULT_IMAGE_OVERFLOW.amountPx),
    offsetXPercent: clampNumber(
      raw.offsetXPercent,
      -100,
      200,
      DEFAULT_IMAGE_OVERFLOW.offsetXPercent,
    ),
    offsetYPercent: clampNumber(
      raw.offsetYPercent,
      -100,
      200,
      DEFAULT_IMAGE_OVERFLOW.offsetYPercent,
    ),
    widthPercent: clampNumber(raw.widthPercent, 20, 220, DEFAULT_IMAGE_OVERFLOW.widthPercent),
  };
}

function sanitizeString(value: unknown, maxLength = MAX_TEXT_LENGTH): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function sanitizeColorOrClass(value: unknown): string {
  const normalized = sanitizeString(value, 120);
  if (!normalized) return "";

  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(normalized)) {
    return normalized;
  }

  if (RGB_RGBA_PATTERN.test(normalized) || HSL_HSLA_PATTERN.test(normalized)) {
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

function sanitizeImageUrl(value: unknown): string {
  const normalized = sanitizeString(value, 2048);
  if (!normalized) return "";

  if (normalized.startsWith("//")) return "";
  if (normalized.startsWith("/")) return normalized;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return "";
}

function sanitizeTracking(value: unknown): HeroTracking {
  if (!isRecord(value)) {
    return {
      campaign: "",
      source: "",
      medium: "",
      content: "",
      custom: {},
    };
  }

  const customRaw = isRecord(value.custom) ? value.custom : {};
  const custom: Record<string, string> = {};
  let count = 0;
  for (const [key, raw] of Object.entries(customRaw)) {
    if (count >= MAX_CUSTOM_ENTRIES) break;
    const normalizedKey = sanitizeString(key, 64);
    const normalizedValue = sanitizeString(raw, 256);
    if (!normalizedKey || !normalizedValue) continue;
    custom[normalizedKey] = normalizedValue;
    count += 1;
  }

  return {
    campaign: sanitizeString(value.campaign),
    source: sanitizeString(value.source),
    medium: sanitizeString(value.medium),
    content: sanitizeString(value.content),
    custom,
  };
}

function sanitizeLink(value: unknown, errors: string[], path: string): HeroSlotLink | null {
  if (!isRecord(value)) return null;

  const rawType = sanitizeString(value.type, 32);
  const type = ALLOWED_LINK_TYPES.has(rawType as HeroSlotLink["type"])
    ? (rawType as HeroSlotLink["type"])
    : null;

  if (!type) {
    errors.push(`${path}.type must be one of: internal, external`);
    return null;
  }

  const href = sanitizeString(value.href, 2048);
  if (!href) {
    errors.push(`${path}.href is required`);
    return null;
  }

  if (type === "internal") {
    if (href.startsWith("//")) {
      errors.push(`${path}.href protocol-relative URLs are not allowed for internal links`);
      return null;
    }
    if (!href.startsWith("/")) {
      errors.push(`${path}.href must start with '/' for internal links`);
      return null;
    }
    return { type, href };
  }

  try {
    const parsed = new URL(href);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      errors.push(`${path}.href external link must be http/https`);
      return null;
    }
  } catch {
    errors.push(`${path}.href must be a valid absolute URL`);
    return null;
  }

  return { type, href };
}

function sanitizeButtonHref(value: unknown, errors: string[], path: string): string {
  const href = sanitizeString(value, 2048);
  if (!href) return "";
  if (href.startsWith("//")) return "";
  if (href.startsWith("/")) return href;

  try {
    const parsed = new URL(href);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return href;
    }
  } catch {
    // no-op
  }

  errors.push(`${path} must be an internal route or http/https URL`);
  return "";
}

function normalizeTehranToUtc(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) return null;

  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(normalized);
  const isoCandidate = hasZone ? normalized : `${normalized}+03:30`;
  const parsed = new Date(isoCandidate);

  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function sanitizeSchedule(value: unknown, errors: string[], path: string): HeroSlideSchedule {
  const scheduleRaw = isRecord(value) ? value : {};

  const startCandidate = sanitizeString(
    scheduleRaw.startAtUtc ?? scheduleRaw.startAt,
    128,
  );
  const endCandidate = sanitizeString(
    scheduleRaw.endAtUtc ?? scheduleRaw.endAt,
    128,
  );

  const startAtUtc = startCandidate ? normalizeTehranToUtc(startCandidate) : null;
  const endAtUtc = endCandidate ? normalizeTehranToUtc(endCandidate) : null;

  if (startCandidate && !startAtUtc) {
    errors.push(`${path}.startAtUtc is invalid`);
  }

  if (endCandidate && !endAtUtc) {
    errors.push(`${path}.endAtUtc is invalid`);
  }

  if (startAtUtc && endAtUtc && new Date(startAtUtc) > new Date(endAtUtc)) {
    errors.push(`${path} has invalid range: startAtUtc must be before endAtUtc`);
  }

  const result: HeroSlideSchedule = {
    timezone: "Asia/Tehran",
  };

  if (startAtUtc) {
    result.startAtUtc = startAtUtc;
  }

  if (endAtUtc) {
    result.endAtUtc = endAtUtc;
  }

  return result;
}

function sanitizeToken<T extends string>(
  value: unknown,
  allowed: Set<T>,
  fallback: T,
  errors: string[],
  path: string,
): T {
  const normalized = sanitizeString(value, 120);
  if (!normalized) {
    return fallback;
  }

  if (!allowed.has(normalized as T)) {
    errors.push(`${path} has invalid token: '${normalized}'`);
    return fallback;
  }

  return normalized as T;
}

function sanitizeTextStyle(
  value: unknown,
  defaults: HeroTextStyle,
  errors: string[],
  path: string,
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
    fontFamily: sanitizeToken(
      raw.fontFamily ?? legacyFont,
      ALLOWED_FONT_FAMILIES,
      defaults.fontFamily,
      errors,
      `${path}.fontFamily`,
    ),
    fontSize: sanitizeToken(
      raw.fontSize ?? legacySize,
      ALLOWED_FONT_SIZES,
      defaults.fontSize,
      errors,
      `${path}.fontSize`,
    ),
    fontWeight: sanitizeToken(
      raw.fontWeight ?? legacyWeight,
      ALLOWED_FONT_WEIGHTS,
      defaults.fontWeight,
      errors,
      `${path}.fontWeight`,
    ),
    lineHeight: sanitizeToken(
      raw.lineHeight ?? legacyLineHeight,
      ALLOWED_LINE_HEIGHTS,
      defaults.lineHeight,
      errors,
      `${path}.lineHeight`,
    ),
    letterSpacing: sanitizeToken(
      raw.letterSpacing ?? legacyTracking,
      ALLOWED_LETTER_SPACINGS,
      defaults.letterSpacing,
      errors,
      `${path}.letterSpacing`,
    ),
  };
}

function sanitizeHeadlineSlot(
  value: unknown,
  errors: string[],
  path: string,
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
    bottomMarginPx: clampNumber(
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
      errors,
      `${path}.titleStyle`,
      colors.titleColor,
      typography,
      "title",
    ),
    subtitleStyle: sanitizeTextStyle(
      raw.subtitleStyle,
      defaults.subtitleStyle,
      errors,
      `${path}.subtitleStyle`,
      colors.subtitleColor,
      typography,
      "subtitle",
    ),
    link: sanitizeLink(raw.link, errors, `${path}.link`),
    tracking: sanitizeTracking(raw.tracking),
  };
}

function sanitizeMainVisualSlot(
  value: unknown,
  errors: string[],
  path: string,
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

  return {
    kind: "mainVisual",
    backgroundColor,
    backgroundType: sanitizeToken(
      raw.backgroundType ?? style.backgroundType,
      ALLOWED_BACKGROUND_TYPES,
      backgroundImageUrl ? "image" : "color",
      errors,
      `${path}.backgroundType`,
    ),
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
    foregroundZoom: clampNumber(raw.foregroundZoom, 0.5, 2, 1),
    foregroundOverflow: sanitizeImageOverflow(raw.foregroundOverflow ?? media.overflow),
    link: sanitizeLink(raw.link, errors, `${path}.link`),
    tracking: sanitizeTracking(raw.tracking),
  };
}

function sanitizeCardSlot(
  value: unknown,
  errors: string[],
  path: string,
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

  const linkObj = isRecord(raw.link) ? raw.link : null;
  const linkHref = linkObj && typeof linkObj.href === "string" ? linkObj.href : undefined;
  const buttonObj = isRecord(raw.button) ? raw.button : null;
  const backgroundImageUrl = sanitizeImageUrl(raw.backgroundImageUrl ?? style.backgroundImageUrl);
  const backgroundColor =
    sanitizeColorOrClass(raw.backgroundColor ?? style.backgroundColor ?? colors.background);

  return {
    kind: "card",
    title: sanitizeString(raw.title),
    subtitle: sanitizeString(raw.subtitle),
    imageUrl: sanitizeImageUrl(raw.imageUrl ?? media.imageUrl) || defaults?.imageUrl || "",
    imageAlt: sanitizeString(raw.imageAlt ?? media.alt, 140) || defaults?.imageAlt || "",
    imageHref: sanitizeButtonHref(raw.imageHref ?? media.href, errors, `${path}.imageHref`),
    imageClassName: sanitizeClassName(raw.imageClassName ?? media.className, 180) || defaults?.imageClassName || "",
    imageObjectPosition:
      sanitizeClassName(raw.imageObjectPosition ?? media.objectPosition, 80) ||
      defaults?.imageObjectPosition ||
      "",
    imageCustomWidth: sanitizeClassName(raw.imageCustomWidth ?? media.customWidth, 80),
    imageCustomHeight: sanitizeClassName(raw.imageCustomHeight ?? media.customHeight, 80),
    imageOverflow: sanitizeImageOverflow(raw.imageOverflow ?? media.overflow),
    buttonLabel: sanitizeString(raw.buttonLabel ?? raw.label, 120),
    buttonHref: sanitizeButtonHref(raw.buttonHref ?? linkHref, errors, `${path}.buttonHref`),
    buttonClassName:
      sanitizeClassName(
        raw.buttonClassName ?? (buttonObj && typeof buttonObj.className === "string" ? buttonObj.className : undefined),
        220,
      ) ||
      defaults?.buttonClassName ||
      "",
    buttonShowArrow:
      typeof raw.buttonShowArrow === "boolean"
        ? raw.buttonShowArrow
        : buttonObj && typeof buttonObj.showArrow === "boolean"
          ? buttonObj.showArrow
          : (defaults?.buttonShowArrow ?? true),
    buttonArrowClassName: sanitizeClassName(
      raw.buttonArrowClassName ??
        (buttonObj && typeof buttonObj.arrowClassName === "string" ? buttonObj.arrowClassName : undefined),
      180,
    ),
    backgroundColor: backgroundColor || defaults?.backgroundColor || "",
    backgroundType: sanitizeToken(
      raw.backgroundType ?? style.backgroundType,
      ALLOWED_BACKGROUND_TYPES,
      backgroundImageUrl ? "image" : "color",
      errors,
      `${path}.backgroundType`,
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
      errors,
      `${path}.contentAlignment`,
    ),
    paddingClassName:
      sanitizeClassName(raw.paddingClassName ?? style.paddingClassName, 220) ||
      defaults?.paddingClassName ||
      DEFAULT_CARD_PADDING_CLASSNAME,
    titleStyle: sanitizeTextStyle(
      raw.titleStyle,
      defaults?.titleStyle || DEFAULT_CARD_TITLE_STYLE,
      errors,
      `${path}.titleStyle`,
      colors.titleColor,
      typography,
      "title",
    ),
    buttonStyle: sanitizeTextStyle(
      raw.buttonStyle,
      defaults?.buttonStyle || DEFAULT_CARD_BUTTON_STYLE,
      errors,
      `${path}.buttonStyle`,
    ),
    link: sanitizeLink(raw.link, errors, `${path}.link`),
    tracking: sanitizeTracking(raw.tracking),
  };
}

function sanitizeSlide(
  value: unknown,
  index: number,
  errors: string[],
): HeroSlideConfig {
  const slideRaw = isRecord(value) ? value : {};
  const slidePath = `slides[${index}]`;

  const id = sanitizeString(slideRaw.id, 80) || `slide-${index + 1}`;
  const isActive = typeof slideRaw.isActive === "boolean" ? slideRaw.isActive : true;
  const autoplayEligible =
    typeof slideRaw.autoplayEligible === "boolean" ? slideRaw.autoplayEligible : true;

  const order = Number.isFinite(Number(slideRaw.order)) ? Number(slideRaw.order) : index;

  const devicesRaw = isRecord(slideRaw.devices) ? slideRaw.devices : {};
  const desktopRaw = isRecord(devicesRaw.desktop) ? devicesRaw.desktop : {};
  const tabletRaw = isRecord(devicesRaw.tablet) ? devicesRaw.tablet : {};
  const mobileRaw = isRecord(devicesRaw.mobile) ? devicesRaw.mobile : {};
  const desktopSlots = isRecord(desktopRaw.slots) ? desktopRaw.slots : {};
  const tabletSlots = isRecord(tabletRaw.slots) ? tabletRaw.slots : {};
  const mobileSlots = isRecord(mobileRaw.slots) ? mobileRaw.slots : {};

  return {
    id,
    isActive,
    autoplayEligible,
    order,
    schedule: sanitizeSchedule(slideRaw.schedule, errors, `${slidePath}.schedule`),
    tracking: sanitizeTracking(slideRaw.tracking),
    devices: {
      desktop: {
        slots: {
          topLeftTextBanner: sanitizeHeadlineSlot(
            desktopSlots.topLeftTextBanner,
            errors,
            `${slidePath}.devices.desktop.slots.topLeftTextBanner`,
            {
              titleStyle: DEFAULT_TOP_HEADLINE_TITLE_STYLE,
              subtitleStyle: DEFAULT_TOP_HEADLINE_SUBTITLE_STYLE,
              backgroundColor: "bg-stone-50",
              bottomMarginPx: 10,
              className: DEFAULT_DESKTOP_HEADLINE_CLASSNAME,
              titleClassName: "",
              subtitleClassName: "",
            },
          ),
          bottomActionBannerLeft: sanitizeCardSlot(
            desktopSlots.bottomActionBannerLeft,
            errors,
            `${slidePath}.devices.desktop.slots.bottomActionBannerLeft`,
            {
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
            },
          ),
          bottomActionBannerRight: sanitizeCardSlot(
            desktopSlots.bottomActionBannerRight,
            errors,
            `${slidePath}.devices.desktop.slots.bottomActionBannerRight`,
            {
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
            },
          ),
          rightBanner: sanitizeMainVisualSlot(
            desktopSlots.rightBanner,
            errors,
            `${slidePath}.devices.desktop.slots.rightBanner`,
            {
              backgroundWidth: DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_WIDTH,
              backgroundHeight: DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_HEIGHT,
              backgroundPosition: DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_POSITION,
              backgroundSize: DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_SIZE,
              backgroundClassName: DEFAULT_DESKTOP_MAIN_VISUAL_BACKGROUND_CLASSNAME,
              foregroundClassName: "",
            },
          ),
        },
      },
      tablet: {
        slots: {
          primaryBanner: sanitizeHeadlineSlot(
            tabletSlots.primaryBanner,
            errors,
            `${slidePath}.devices.tablet.slots.primaryBanner`,
            {
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
            },
          ),
          bottomActionBannerLeft: sanitizeCardSlot(
            tabletSlots.bottomActionBannerLeft,
            errors,
            `${slidePath}.devices.tablet.slots.bottomActionBannerLeft`,
            {
              className: DEFAULT_TABLET_CARD_LEFT_CLASSNAME,
              imageClassName: DEFAULT_TABLET_CARD_LEFT_IMAGE_CLASSNAME,
              imageObjectPosition: "left bottom",
              contentAlignment: "center",
              buttonClassName: DEFAULT_COMPACT_CARD_BUTTON_CLASSNAME,
              backgroundClassName: DEFAULT_COMPACT_CARD_BACKGROUND_CLASSNAME,
              buttonShowArrow: true,
            },
          ),
          bottomActionBannerRight: sanitizeCardSlot(
            tabletSlots.bottomActionBannerRight,
            errors,
            `${slidePath}.devices.tablet.slots.bottomActionBannerRight`,
            {
              className: DEFAULT_TABLET_CARD_RIGHT_CLASSNAME,
              imageClassName: DEFAULT_TABLET_CARD_RIGHT_IMAGE_CLASSNAME,
              imageObjectPosition: "left bottom",
              contentAlignment: "center",
              buttonClassName: DEFAULT_COMPACT_CARD_BUTTON_CLASSNAME,
              backgroundClassName: DEFAULT_COMPACT_CARD_BACKGROUND_CLASSNAME,
              buttonShowArrow: true,
            },
          ),
          heroBanner: sanitizeMainVisualSlot(
            tabletSlots.heroBanner,
            errors,
            `${slidePath}.devices.tablet.slots.heroBanner`,
            {
              backgroundWidth: DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_WIDTH,
              backgroundHeight: DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_HEIGHT,
              backgroundPosition: DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_POSITION,
              backgroundSize: DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_SIZE,
              backgroundClassName: DEFAULT_TABLET_MAIN_VISUAL_BACKGROUND_CLASSNAME,
              foregroundClassName: DEFAULT_TABLET_MAIN_VISUAL_FOREGROUND_CLASSNAME,
              foregroundObjectPosition: DEFAULT_TABLET_MAIN_VISUAL_FOREGROUND_POSITION,
            },
          ),
        },
      },
      mobile: {
        slots: {
          primaryBanner: sanitizeHeadlineSlot(
            mobileSlots.primaryBanner,
            errors,
            `${slidePath}.devices.mobile.slots.primaryBanner`,
            {
              titleStyle: DEFAULT_PRIMARY_TITLE_STYLE,
              subtitleStyle: DEFAULT_PRIMARY_SUBTITLE_STYLE,
              backgroundColor: "bg-stone-50",
              bottomMarginPx: 0,
              className: DEFAULT_MOBILE_HEADLINE_CLASSNAME,
              titleClassName: "",
              subtitleClassName: "",
            },
          ),
          bottomActionBannerLeft: sanitizeCardSlot(
            mobileSlots.bottomActionBannerLeft,
            errors,
            `${slidePath}.devices.mobile.slots.bottomActionBannerLeft`,
            {
              className: DEFAULT_MOBILE_CARD_LEFT_CLASSNAME,
              imageClassName: DEFAULT_MOBILE_CARD_LEFT_IMAGE_CLASSNAME,
              imageObjectPosition: "left bottom",
              contentAlignment: "center",
              paddingClassName: DEFAULT_MOBILE_CARD_PADDING_CLASSNAME,
              buttonClassName: DEFAULT_COMPACT_CARD_BUTTON_CLASSNAME,
              backgroundClassName: DEFAULT_COMPACT_CARD_BACKGROUND_CLASSNAME,
              buttonShowArrow: true,
            },
          ),
          bottomActionBannerRight: sanitizeCardSlot(
            mobileSlots.bottomActionBannerRight,
            errors,
            `${slidePath}.devices.mobile.slots.bottomActionBannerRight`,
            {
              className: DEFAULT_MOBILE_CARD_RIGHT_CLASSNAME,
              imageClassName: DEFAULT_MOBILE_CARD_RIGHT_IMAGE_CLASSNAME,
              imageObjectPosition: "left bottom",
              contentAlignment: "center",
              paddingClassName: DEFAULT_MOBILE_CARD_PADDING_CLASSNAME,
              buttonClassName: DEFAULT_COMPACT_CARD_BUTTON_CLASSNAME,
              backgroundClassName: DEFAULT_COMPACT_CARD_BACKGROUND_CLASSNAME,
              buttonShowArrow: true,
            },
          ),
          heroBanner: sanitizeMainVisualSlot(
            mobileSlots.heroBanner,
            errors,
            `${slidePath}.devices.mobile.slots.heroBanner`,
            {
              backgroundWidth: DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_WIDTH,
              backgroundHeight: DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_HEIGHT,
              backgroundPosition: DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_POSITION,
              backgroundSize: DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_SIZE,
              backgroundClassName: DEFAULT_MOBILE_MAIN_VISUAL_BACKGROUND_CLASSNAME,
              foregroundClassName: DEFAULT_MOBILE_MAIN_VISUAL_FOREGROUND_CLASSNAME,
              foregroundObjectPosition: DEFAULT_MOBILE_MAIN_VISUAL_FOREGROUND_POSITION,
            },
          ),
        },
      },
    },
  };
}

export function createDefaultHeroSliderPayload(): HeroSliderPayload {
  return {
    version: 2,
    autoplayIntervalMs: DEFAULT_AUTOPLAY_INTERVAL_MS,
    slides: [],
  };
}

export function sanitizeHeroSliderPayload(input: unknown): HeroSliderSanitizationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return {
      value: createDefaultHeroSliderPayload(),
      errors: ["Hero slider payload must be an object"],
    };
  }

  const rawSlidesArray = Array.isArray(input.slides) ? input.slides : [];
  if (!Array.isArray(input.slides) && input.slides !== undefined) {
    errors.push("slides must be an array");
  }

  if (rawSlidesArray.length > MAX_SLIDES) {
    errors.push(`slides exceed maximum of ${MAX_SLIDES}`);
  }

  const rawSlides = rawSlidesArray.slice(0, MAX_SLIDES);
  const slides = rawSlides.map((slide, index) => sanitizeSlide(slide, index, errors));

  return {
    value: {
      version: 2,
      autoplayIntervalMs: clampNumber(
        input.autoplayIntervalMs,
        MIN_AUTOPLAY_INTERVAL_MS,
        MAX_AUTOPLAY_INTERVAL_MS,
        DEFAULT_AUTOPLAY_INTERVAL_MS,
      ),
      slides,
    },
    errors,
  };
}

export function normalizeStoredHeroSliderPayload(input: unknown): HeroSliderPayload {
  const { value } = sanitizeHeroSliderPayload(input);
  return value;
}

export function createHeroSliderMeta(publishedBy: number | null): HeroSliderMeta {
  return {
    version: 2,
    publishedAt: new Date().toISOString(),
    publishedBy,
  };
}
