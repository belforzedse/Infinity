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

export type HeroSlotFit = "cover" | "contain";
export type HeroLinkType = "internal" | "external";
export type HeroRadiusToken = "none" | "sm" | "md" | "lg" | "xl" | "full";
export type HeroOverlayToken = "none" | "soft" | "medium" | "strong";
export type HeroPaddingToken = "none" | "sm" | "md" | "lg";
export type HeroShadowToken = "none" | "sm" | "md" | "lg";

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

export type HeroSlotMedia = {
  type: "image";
  imageUrl: string;
  alt: string;
  fit: HeroSlotFit;
  objectPosition: string;
  focalX: number;
  focalY: number;
  zoom: number;
};

export type HeroSlotStyle = {
  backgroundColor: string;
  backgroundImageUrl: string;
  radiusToken: HeroRadiusToken;
  overlayToken: HeroOverlayToken;
  paddingToken: HeroPaddingToken;
  shadowToken: HeroShadowToken;
};

export type HeroSlotConfig = {
  title: string;
  subtitle: string;
  label: string;
  media: HeroSlotMedia;
  style: HeroSlotStyle;
  link: HeroSlotLink | null;
  tracking: HeroTracking;
};

export type HeroSlideSchedule = {
  timezone: typeof HERO_SCHEDULE_TIMEZONE;
  startAtUtc?: string;
  endAtUtc?: string;
};

export type HeroSlideDevices = {
  desktop: {
    slots: Record<HeroDesktopSlotKey, HeroSlotConfig>;
  };
  tablet: {
    slots: Record<HeroTabletSlotKey, HeroSlotConfig>;
  };
  mobile: {
    slots: Record<HeroMobileSlotKey, HeroSlotConfig>;
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

const ALLOWED_FITS = new Set<HeroSlotFit>(["cover", "contain"]);
const ALLOWED_LINK_TYPES = new Set<HeroLinkType>(["internal", "external"]);
const ALLOWED_RADIUS_TOKENS = new Set<HeroRadiusToken>(["none", "sm", "md", "lg", "xl", "full"]);
const ALLOWED_OVERLAY_TOKENS = new Set<HeroOverlayToken>(["none", "soft", "medium", "strong"]);
const ALLOWED_PADDING_TOKENS = new Set<HeroPaddingToken>(["none", "sm", "md", "lg"]);
const ALLOWED_SHADOW_TOKENS = new Set<HeroShadowToken>(["none", "sm", "md", "lg"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeString(value: unknown, maxLength = 280): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function sanitizeObjectPosition(value: unknown): string {
  const normalized = sanitizeString(value, 64);
  return normalized || "center";
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

function sanitizeToken<T extends string>(
  value: unknown,
  allowed: Set<T>,
  fallback: T,
): T {
  const normalized = sanitizeString(value, 32);
  if (!normalized) return fallback;
  if (!allowed.has(normalized as T)) return fallback;
  return normalized as T;
}

function sanitizeDateIso(value: unknown): string | undefined {
  const normalized = sanitizeString(value, 128);
  if (!normalized) return undefined;

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed.toISOString();
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

function createDefaultSlotConfig(): HeroSlotConfig {
  return {
    title: "",
    subtitle: "",
    label: "",
    media: {
      type: "image",
      imageUrl: "",
      alt: "",
      fit: "contain",
      objectPosition: "center",
      focalX: 50,
      focalY: 50,
      zoom: 1,
    },
    style: {
      backgroundColor: "",
      backgroundImageUrl: "",
      radiusToken: "md",
      overlayToken: "none",
      paddingToken: "md",
      shadowToken: "none",
    },
    link: null,
    tracking: createDefaultTracking(),
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

function normalizeSlotConfig(value: unknown): HeroSlotConfig {
  const slotRaw = isRecord(value) ? value : {};
  const mediaRaw = isRecord(slotRaw.media) ? slotRaw.media : {};
  const styleRaw = isRecord(slotRaw.style) ? slotRaw.style : {};

  return {
    ...createDefaultSlotConfig(),
    title: sanitizeString(slotRaw.title),
    subtitle: sanitizeString(slotRaw.subtitle),
    label: sanitizeString(slotRaw.label),
    media: {
      type: "image",
      imageUrl: sanitizeImageUrl(mediaRaw.imageUrl),
      alt: sanitizeString(mediaRaw.alt, 140),
      fit: sanitizeToken(mediaRaw.fit, ALLOWED_FITS, "contain"),
      objectPosition: sanitizeObjectPosition(mediaRaw.objectPosition),
      focalX: clamp(mediaRaw.focalX, 0, 100, 50),
      focalY: clamp(mediaRaw.focalY, 0, 100, 50),
      zoom: clamp(mediaRaw.zoom, 1, 2.5, 1),
    },
    style: {
      backgroundColor: sanitizeString(styleRaw.backgroundColor, 32),
      backgroundImageUrl: sanitizeImageUrl(styleRaw.backgroundImageUrl),
      radiusToken: sanitizeToken(styleRaw.radiusToken, ALLOWED_RADIUS_TOKENS, "md"),
      overlayToken: sanitizeToken(styleRaw.overlayToken, ALLOWED_OVERLAY_TOKENS, "none"),
      paddingToken: sanitizeToken(styleRaw.paddingToken, ALLOWED_PADDING_TOKENS, "md"),
      shadowToken: sanitizeToken(styleRaw.shadowToken, ALLOWED_SHADOW_TOKENS, "none"),
    },
    link: sanitizeSlotLink(slotRaw.link),
    tracking: normalizeHeroTracking(slotRaw.tracking),
  };
}

function normalizeSlots<T extends readonly string[]>(
  rawSlots: unknown,
  allowedKeys: T,
): Record<T[number], HeroSlotConfig> {
  const slotsRaw = isRecord(rawSlots) ? rawSlots : {};

  return allowedKeys.reduce<Record<T[number], HeroSlotConfig>>((acc, key) => {
    acc[key] = normalizeSlotConfig(slotsRaw[key]);
    return acc;
  }, {} as Record<T[number], HeroSlotConfig>);
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
        slots: normalizeSlots(
          isRecord(devicesRaw.desktop) ? devicesRaw.desktop.slots : undefined,
          HERO_DESKTOP_SLOT_KEYS,
        ),
      },
      tablet: {
        slots: normalizeSlots(
          isRecord(devicesRaw.tablet) ? devicesRaw.tablet.slots : undefined,
          HERO_TABLET_SLOT_KEYS,
        ),
      },
      mobile: {
        slots: normalizeSlots(
          isRecord(devicesRaw.mobile) ? devicesRaw.mobile.slots : undefined,
          HERO_MOBILE_SLOT_KEYS,
        ),
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
