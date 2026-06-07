import {
  DEFAULT_AUTOPLAY_INTERVAL_MS,
  MIN_AUTOPLAY_INTERVAL_MS,
  MAX_AUTOPLAY_INTERVAL_MS,
} from "./hero-slider-defaults";
import type {
  HeroSlotLink,
  HeroTracking,
  HeroSlideSchedule,
  HeroSlideConfig,
  HeroSliderPayload,
  HeroSliderMeta,
  HeroSliderSanitizationResult,
} from "./hero-slider-types";

const HERO_SLIDER_VERSION = 3;
const HERO_SCHEDULE_TIMEZONE = "Asia/Tehran";
const MAX_CUSTOM_ENTRIES = 20;
const MAX_SLIDES = 50;
const MAX_TEXT_LENGTH = 280;
const OBSOLETE_V3_FIELDS = [
  "devices",
  "slots",
  "topLeftTextBanner",
  "primaryBanner",
  "rightBanner",
  "heroBanner",
  "bottomActionBannerLeft",
  "bottomActionBannerRight",
  "backgroundImageUrl",
  "foregroundImageUrl",
  "foregroundZoom",
  "foregroundOverflow",
  "imageOverflow",
  "innerBorder",
  "contentAlignment",
] as const;

const EMPTY_TRACKING: HeroTracking = {
  campaign: "",
  source: "",
  medium: "",
  content: "",
  custom: {},
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeString(value: unknown, maxLength = MAX_TEXT_LENGTH): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function sanitizeImageUrl(value: unknown): string {
  const normalized = sanitizeString(value, 2048);
  if (!normalized || normalized.startsWith("//")) return "";
  if (normalized.startsWith("/") || normalized.startsWith("data:")) return normalized;
  return /^https?:\/\//i.test(normalized) ? normalized : "";
}

function sanitizeHref(value: unknown): string {
  const href = sanitizeString(value, 2048);
  if (!href || href.startsWith("//")) return "";
  if (href.startsWith("/") || /^https?:\/\//i.test(href)) return href;
  return "";
}

function sanitizeLink(value: unknown, errors: string[], path: string): HeroSlotLink | null {
  if (!isRecord(value)) return null;
  const href = sanitizeHref(value.href);
  if (!href) {
    errors.push(`${path}.href must be an internal path or http/https URL`);
    return null;
  }

  const type =
    value.type === "external" || /^https?:\/\//i.test(href) ? "external" : "internal";

  if (type === "internal" && !href.startsWith("/")) {
    errors.push(`${path}.href must start with / for internal links`);
    return null;
  }

  if (type === "external" && !/^https?:\/\//i.test(href)) {
    errors.push(`${path}.href must use http/https for external links`);
    return null;
  }

  return { type, href };
}

function sanitizeTracking(value: unknown): HeroTracking {
  if (!isRecord(value)) return { ...EMPTY_TRACKING, custom: {} };
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

function sanitizeDateIso(value: unknown): string | undefined {
  const raw = sanitizeString(value, 80);
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function sanitizeSchedule(value: unknown, errors: string[], path: string): HeroSlideSchedule {
  const raw = isRecord(value) ? value : {};
  const startAtUtc = sanitizeDateIso(raw.startAtUtc ?? raw.startAt);
  const endAtUtc = sanitizeDateIso(raw.endAtUtc ?? raw.endAt);

  if (startAtUtc && endAtUtc && new Date(startAtUtc) >= new Date(endAtUtc)) {
    errors.push(`${path} has invalid range: startAtUtc must be before endAtUtc`);
  }

  return {
    timezone: HERO_SCHEDULE_TIMEZONE,
    ...(startAtUtc ? { startAtUtc } : {}),
    ...(endAtUtc ? { endAtUtc } : {}),
  };
}

function readPath(root: unknown, path: readonly string[]): unknown {
  let current = root;
  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return current;
}

function firstImageUrl(...values: unknown[]): string {
  for (const value of values) {
    const imageUrl = sanitizeImageUrl(value);
    if (imageUrl) return imageUrl;
  }
  return "";
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    const normalized = sanitizeString(value, 140);
    if (normalized) return normalized;
  }
  return "";
}

function hasLegacySlideShape(value: unknown): boolean {
  return isRecord(value) && isRecord(value.devices);
}

function sanitizeLegacySlide(
  slideRaw: Record<string, unknown>,
  index: number,
  errors: string[],
): HeroSlideConfig {
  const slidePath = `slides[${index}]`;
  const desktopRight = readPath(slideRaw, ["devices", "desktop", "slots", "rightBanner"]);
  const tabletHero = readPath(slideRaw, ["devices", "tablet", "slots", "heroBanner"]);
  const mobileHero = readPath(slideRaw, ["devices", "mobile", "slots", "heroBanner"]);

  return {
    id: sanitizeString(slideRaw.id, 80) || `slide-${index + 1}`,
    imageUrl: firstImageUrl(
      readPath(desktopRight, ["foregroundImageUrl"]),
      readPath(desktopRight, ["backgroundImageUrl"]),
      readPath(tabletHero, ["foregroundImageUrl"]),
      readPath(tabletHero, ["backgroundImageUrl"]),
    ),
    imageAlt: firstString(
      readPath(desktopRight, ["foregroundAlt"]),
      readPath(tabletHero, ["foregroundAlt"]),
    ),
    mobileImageUrl: firstImageUrl(
      readPath(mobileHero, ["foregroundImageUrl"]),
      readPath(mobileHero, ["backgroundImageUrl"]),
    ),
    mobileImageAlt: firstString(readPath(mobileHero, ["foregroundAlt"])),
    link:
      sanitizeLink(readPath(desktopRight, ["link"]), errors, `${slidePath}.legacyLink`) ??
      sanitizeLink(readPath(tabletHero, ["link"]), errors, `${slidePath}.legacyLink`) ??
      sanitizeLink(readPath(mobileHero, ["link"]), errors, `${slidePath}.legacyLink`),
    isActive: typeof slideRaw.isActive === "boolean" ? slideRaw.isActive : true,
    autoplayEligible:
      typeof slideRaw.autoplayEligible === "boolean" ? slideRaw.autoplayEligible : true,
    order: Number.isFinite(Number(slideRaw.order)) ? Number(slideRaw.order) : index,
    schedule: sanitizeSchedule(slideRaw.schedule, errors, `${slidePath}.schedule`),
    tracking: sanitizeTracking(slideRaw.tracking),
  };
}

function rejectObsoleteV3Fields(slideRaw: Record<string, unknown>, errors: string[], path: string) {
  for (const key of OBSOLETE_V3_FIELDS) {
    if (key in slideRaw) {
      errors.push(`${path}.${key} is obsolete for hero slider version 3`);
    }
  }
}

function sanitizeV3Slide(value: unknown, index: number, errors: string[]): HeroSlideConfig {
  const slideRaw = isRecord(value) ? value : {};
  const slidePath = `slides[${index}]`;
  rejectObsoleteV3Fields(slideRaw, errors, slidePath);

  return {
    id: sanitizeString(slideRaw.id, 80) || `slide-${index + 1}`,
    imageUrl: sanitizeImageUrl(slideRaw.imageUrl),
    imageAlt: sanitizeString(slideRaw.imageAlt, 140),
    mobileImageUrl: sanitizeImageUrl(slideRaw.mobileImageUrl),
    mobileImageAlt: sanitizeString(slideRaw.mobileImageAlt, 140),
    link: sanitizeLink(slideRaw.link, errors, `${slidePath}.link`),
    isActive: typeof slideRaw.isActive === "boolean" ? slideRaw.isActive : true,
    autoplayEligible:
      typeof slideRaw.autoplayEligible === "boolean" ? slideRaw.autoplayEligible : true,
    order: Number.isFinite(Number(slideRaw.order)) ? Number(slideRaw.order) : index,
    schedule: sanitizeSchedule(slideRaw.schedule, errors, `${slidePath}.schedule`),
    tracking: sanitizeTracking(slideRaw.tracking),
  };
}

export function createDefaultHeroSliderPayload(): HeroSliderPayload {
  return {
    version: HERO_SLIDER_VERSION,
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
  const shouldUseLegacyNormalizer =
    input.version === 2 ||
    (input.version !== HERO_SLIDER_VERSION && rawSlides.some(hasLegacySlideShape));

  const slides = rawSlides.map((slide, index) =>
    shouldUseLegacyNormalizer && isRecord(slide)
      ? sanitizeLegacySlide(slide, index, errors)
      : sanitizeV3Slide(slide, index, errors),
  );

  return {
    value: {
      version: HERO_SLIDER_VERSION,
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
    version: HERO_SLIDER_VERSION,
    publishedAt: new Date().toISOString(),
    publishedBy,
  };
}
