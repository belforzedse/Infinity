export const HERO_SLIDER_VERSION = 3 as const;
export const HERO_SCHEDULE_TIMEZONE = "Asia/Tehran" as const;
export const DEFAULT_AUTOPLAY_INTERVAL_MS = 600000;
export const MIN_AUTOPLAY_INTERVAL_MS = 3000;
export const MAX_AUTOPLAY_INTERVAL_MS = 3600000;
export const MAX_HERO_SLIDES = 50;

export type HeroLinkType = "internal" | "external";

export type HeroSlotLink = {
  type: HeroLinkType;
  href: string;
};

export type HeroTracking = {
  campaign: string;
  source: string;
  medium: string;
  content: string;
  custom: Record<string, string>;
};

export type HeroSlideSchedule = {
  timezone: typeof HERO_SCHEDULE_TIMEZONE;
  startAtUtc?: string;
  endAtUtc?: string;
};

export type HeroSlideConfig = {
  id: string;
  imageUrl: string;
  imageAlt: string;
  link: HeroSlotLink | null;
  isActive: boolean;
  autoplayEligible: boolean;
  order: number;
  schedule: HeroSlideSchedule;
  tracking: HeroTracking;
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

function sanitizeString(value: unknown, maxLength = 280): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
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
  if (href.startsWith("/")) return href;
  return /^https?:\/\//i.test(href) ? href : "";
}

function normalizeLink(value: unknown): HeroSlotLink | null {
  if (!isRecord(value)) return null;
  const href = sanitizeHref(value.href);
  if (!href) return null;
  const type = value.type === "external" || /^https?:\/\//i.test(href) ? "external" : "internal";
  return { type, href };
}

function normalizeTracking(value: unknown): HeroTracking {
  if (!isRecord(value)) return EMPTY_TRACKING;
  const customRaw = isRecord(value.custom) ? value.custom : {};
  const custom: Record<string, string> = {};

  for (const [rawKey, rawValue] of Object.entries(customRaw).slice(0, 20)) {
    const key = sanitizeString(rawKey, 64);
    const customValue = sanitizeString(rawValue, 256);
    if (key && customValue) {
      custom[key] = customValue;
    }
  }

  return {
    campaign: sanitizeString(value.campaign),
    source: sanitizeString(value.source),
    medium: sanitizeString(value.medium),
    content: sanitizeString(value.content),
    custom,
  };
}

function normalizeDateIso(value: unknown): string | undefined {
  const raw = sanitizeString(value, 80);
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function normalizeSchedule(value: unknown): HeroSlideSchedule {
  const raw = isRecord(value) ? value : {};
  const startAtUtc = normalizeDateIso(raw.startAtUtc ?? raw.startAt);
  const endAtUtc = normalizeDateIso(raw.endAtUtc ?? raw.endAt);

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
    const text = sanitizeString(value, 140);
    if (text) return text;
  }
  return "";
}

function normalizeLegacySlide(slideRaw: Record<string, unknown>, index: number): HeroSlideConfig {
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
      readPath(mobileHero, ["foregroundImageUrl"]),
      readPath(mobileHero, ["backgroundImageUrl"]),
    ),
    imageAlt: firstString(
      readPath(desktopRight, ["foregroundAlt"]),
      readPath(tabletHero, ["foregroundAlt"]),
      readPath(mobileHero, ["foregroundAlt"]),
    ),
    link:
      normalizeLink(readPath(desktopRight, ["link"])) ??
      normalizeLink(readPath(tabletHero, ["link"])) ??
      normalizeLink(readPath(mobileHero, ["link"])),
    isActive: typeof slideRaw.isActive === "boolean" ? slideRaw.isActive : true,
    autoplayEligible:
      typeof slideRaw.autoplayEligible === "boolean" ? slideRaw.autoplayEligible : true,
    order: Number.isFinite(Number(slideRaw.order)) ? Number(slideRaw.order) : index,
    schedule: normalizeSchedule(slideRaw.schedule),
    tracking: normalizeTracking(slideRaw.tracking),
  };
}

function normalizeV3Slide(value: unknown, index: number): HeroSlideConfig {
  const slideRaw = isRecord(value) ? value : {};
  return {
    id: sanitizeString(slideRaw.id, 80) || `slide-${index + 1}`,
    imageUrl: sanitizeImageUrl(slideRaw.imageUrl),
    imageAlt: sanitizeString(slideRaw.imageAlt, 140),
    link: normalizeLink(slideRaw.link),
    isActive: typeof slideRaw.isActive === "boolean" ? slideRaw.isActive : true,
    autoplayEligible:
      typeof slideRaw.autoplayEligible === "boolean" ? slideRaw.autoplayEligible : true,
    order: Number.isFinite(Number(slideRaw.order)) ? Number(slideRaw.order) : index,
    schedule: normalizeSchedule(slideRaw.schedule),
    tracking: normalizeTracking(slideRaw.tracking),
  };
}

function hasLegacySlideShape(value: unknown): boolean {
  return isRecord(value) && isRecord(value.devices);
}

export function createDefaultHeroSliderPayload(): HeroSliderPayload {
  return {
    version: HERO_SLIDER_VERSION,
    autoplayIntervalMs: DEFAULT_AUTOPLAY_INTERVAL_MS,
    slides: [],
  };
}

export function normalizeHeroSliderPayload(value: unknown): HeroSliderPayload {
  if (!isRecord(value)) return createDefaultHeroSliderPayload();

  const rawSlides = Array.isArray(value.slides) ? value.slides.slice(0, MAX_HERO_SLIDES) : [];
  const shouldUseLegacyNormalizer =
    value.version === 2 || (value.version !== HERO_SLIDER_VERSION && rawSlides.some(hasLegacySlideShape));
  const slides = rawSlides.map((slide, index) =>
    shouldUseLegacyNormalizer && isRecord(slide)
      ? normalizeLegacySlide(slide, index)
      : normalizeV3Slide(slide, index),
  );

  return {
    version: HERO_SLIDER_VERSION,
    autoplayIntervalMs: clampNumber(
      value.autoplayIntervalMs,
      MIN_AUTOPLAY_INTERVAL_MS,
      MAX_AUTOPLAY_INTERVAL_MS,
      DEFAULT_AUTOPLAY_INTERVAL_MS,
    ),
    slides,
  };
}

export function normalizeHeroSliderMeta(value: unknown): HeroSliderMeta | null {
  if (!isRecord(value)) return null;
  const publishedAt = sanitizeString(value.publishedAt, 80);
  const date = publishedAt ? new Date(publishedAt) : null;
  return {
    version: HERO_SLIDER_VERSION,
    publishedAt: date && !Number.isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString(),
    publishedBy: Number.isFinite(Number(value.publishedBy)) ? Number(value.publishedBy) : null,
  };
}

export function isHeroSlideVisible(slide: HeroSlideConfig, now = new Date()): boolean {
  if (!slide.isActive || !slide.imageUrl.trim()) return false;
  const start = slide.schedule.startAtUtc ? new Date(slide.schedule.startAtUtc) : null;
  const end = slide.schedule.endAtUtc ? new Date(slide.schedule.endAtUtc) : null;
  if (start && !Number.isNaN(start.getTime()) && now < start) return false;
  if (end && !Number.isNaN(end.getTime()) && now > end) return false;
  return true;
}

export function createEmptyHeroSlide(order: number): HeroSlideConfig {
  return {
    id: `slide-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    imageUrl: "",
    imageAlt: "",
    link: null,
    isActive: true,
    autoplayEligible: true,
    order,
    schedule: { timezone: HERO_SCHEDULE_TIMEZONE },
    tracking: { ...EMPTY_TRACKING, custom: {} },
  };
}
