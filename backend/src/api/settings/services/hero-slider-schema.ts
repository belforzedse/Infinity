const DEFAULT_AUTOPLAY_INTERVAL_MS = 600000;
const MIN_AUTOPLAY_INTERVAL_MS = 3000;
const MAX_AUTOPLAY_INTERVAL_MS = 3600000;
const MAX_TEXT_LENGTH = 280;

const ALLOWED_FIT = new Set(["cover", "contain"] as const);
const ALLOWED_LINK_TYPES = new Set(["internal", "external"] as const);
const ALLOWED_RADIUS_TOKENS = new Set(["none", "sm", "md", "lg", "xl", "full"] as const);
const ALLOWED_OVERLAY_TOKENS = new Set(["none", "soft", "medium", "strong"] as const);
const ALLOWED_PADDING_TOKENS = new Set(["none", "sm", "md", "lg"] as const);
const ALLOWED_SHADOW_TOKENS = new Set(["none", "sm", "md", "lg"] as const);

const DESKTOP_SLOT_KEYS = [
  "topLeftTextBanner",
  "bottomActionBannerLeft",
  "bottomActionBannerRight",
  "rightBanner",
] as const;

const TABLET_SLOT_KEYS = [
  "primaryBanner",
  "bottomActionBannerLeft",
  "bottomActionBannerRight",
  "heroBanner",
] as const;

const MOBILE_SLOT_KEYS = [
  "primaryBanner",
  "bottomActionBannerLeft",
  "bottomActionBannerRight",
  "heroBanner",
] as const;

type DesktopSlotKey = (typeof DESKTOP_SLOT_KEYS)[number];
type TabletSlotKey = (typeof TABLET_SLOT_KEYS)[number];
type MobileSlotKey = (typeof MOBILE_SLOT_KEYS)[number];

type HeroSlotKey = DesktopSlotKey | TabletSlotKey | MobileSlotKey;

export type HeroSlotLink = {
  type: "internal" | "external";
  href: string;
};

export type HeroSlotMedia = {
  type: "image";
  imageUrl: string;
  alt: string;
  fit: "cover" | "contain";
  objectPosition: string;
  focalX: number;
  focalY: number;
  zoom: number;
};

export type HeroSlotStyle = {
  backgroundColor: string;
  backgroundImageUrl: string;
  radiusToken: "none" | "sm" | "md" | "lg" | "xl" | "full";
  overlayToken: "none" | "soft" | "medium" | "strong";
  paddingToken: "none" | "sm" | "md" | "lg";
  shadowToken: "none" | "sm" | "md" | "lg";
};

export type HeroTracking = {
  campaign: string;
  source: string;
  medium: string;
  content: string;
  custom: Record<string, string>;
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
  timezone: "Asia/Tehran";
  startAtUtc?: string;
  endAtUtc?: string;
};

export type HeroSlideDevices = {
  desktop: {
    slots: Record<DesktopSlotKey, HeroSlotConfig>;
  };
  tablet: {
    slots: Record<TabletSlotKey, HeroSlotConfig>;
  };
  mobile: {
    slots: Record<MobileSlotKey, HeroSlotConfig>;
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
  version: 1;
  autoplayIntervalMs: number;
  slides: HeroSlideConfig[];
};

export type HeroSliderMeta = {
  version: 1;
  publishedAt: string;
  publishedBy: number | null;
};

export type HeroSliderSanitizationResult = {
  value: HeroSliderPayload;
  errors: string[];
};

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

function sanitizeString(value: unknown, maxLength = MAX_TEXT_LENGTH): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function sanitizeColor(value: unknown): string {
  const normalized = sanitizeString(value, 32);
  if (!normalized) return "";

  if (/^#[0-9a-fA-F]{3,8}$/.test(normalized)) {
    return normalized;
  }

  if (/^(rgba?|hsla?)\([^)]*\)$/.test(normalized)) {
    return normalized;
  }

  return "";
}

function sanitizeImageUrl(value: unknown): string {
  const normalized = sanitizeString(value, 2048);
  if (!normalized) return "";

  if (normalized.startsWith("/")) {
    return normalized;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return "";
}

function sanitizeObjectPosition(value: unknown): string {
  const normalized = sanitizeString(value, 64);
  return normalized || "center";
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

function sanitizeLink(value: unknown, errors: string[], path: string): HeroSlotLink | null {
  if (!isRecord(value)) {
    return null;
  }

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
  const normalized = sanitizeString(value, 32);
  if (!normalized) {
    return fallback;
  }

  if (!allowed.has(normalized as T)) {
    errors.push(`${path} has invalid token: '${normalized}'`);
    return fallback;
  }

  return normalized as T;
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
    tracking: {
      campaign: "",
      source: "",
      medium: "",
      content: "",
      custom: {},
    },
  };
}

function sanitizeSlotConfig(
  value: unknown,
  errors: string[],
  path: string,
): HeroSlotConfig {
  const slotRaw = isRecord(value) ? value : {};
  const slot = createDefaultSlotConfig();

  slot.title = sanitizeString(slotRaw.title);
  slot.subtitle = sanitizeString(slotRaw.subtitle);
  slot.label = sanitizeString(slotRaw.label);

  const mediaRaw = isRecord(slotRaw.media) ? slotRaw.media : {};
  const fitToken = sanitizeString(mediaRaw.fit, 16);
  if (fitToken && !ALLOWED_FIT.has(fitToken as HeroSlotMedia["fit"])) {
    errors.push(`${path}.media.fit must be cover or contain`);
  }

  slot.media = {
    type: "image",
    imageUrl: sanitizeImageUrl(mediaRaw.imageUrl),
    alt: sanitizeString(mediaRaw.alt, 140),
    fit: ALLOWED_FIT.has(fitToken as HeroSlotMedia["fit"])
      ? (fitToken as HeroSlotMedia["fit"])
      : "contain",
    objectPosition: sanitizeObjectPosition(mediaRaw.objectPosition),
    focalX: clampNumber(mediaRaw.focalX, 0, 100, 50),
    focalY: clampNumber(mediaRaw.focalY, 0, 100, 50),
    zoom: clampNumber(mediaRaw.zoom, 1, 2.5, 1),
  };

  const styleRaw = isRecord(slotRaw.style) ? slotRaw.style : {};
  slot.style = {
    backgroundColor: sanitizeColor(styleRaw.backgroundColor),
    backgroundImageUrl: sanitizeImageUrl(styleRaw.backgroundImageUrl),
    radiusToken: sanitizeToken(
      styleRaw.radiusToken,
      ALLOWED_RADIUS_TOKENS,
      "md",
      errors,
      `${path}.style.radiusToken`,
    ),
    overlayToken: sanitizeToken(
      styleRaw.overlayToken,
      ALLOWED_OVERLAY_TOKENS,
      "none",
      errors,
      `${path}.style.overlayToken`,
    ),
    paddingToken: sanitizeToken(
      styleRaw.paddingToken,
      ALLOWED_PADDING_TOKENS,
      "md",
      errors,
      `${path}.style.paddingToken`,
    ),
    shadowToken: sanitizeToken(
      styleRaw.shadowToken,
      ALLOWED_SHADOW_TOKENS,
      "none",
      errors,
      `${path}.style.shadowToken`,
    ),
  };

  slot.link = sanitizeLink(slotRaw.link, errors, `${path}.link`);
  slot.tracking = sanitizeTracking(slotRaw.tracking);

  return slot;
}

function sanitizeSlotsByKeys<T extends readonly HeroSlotKey[]>(
  value: unknown,
  allowedKeys: T,
  errors: string[],
  path: string,
): Record<T[number], HeroSlotConfig> {
  const rawSlots = isRecord(value) ? value : {};

  return allowedKeys.reduce<Record<T[number], HeroSlotConfig>>((acc, slotKey) => {
    acc[slotKey] = sanitizeSlotConfig(rawSlots[slotKey], errors, `${path}.${slotKey}`);
    return acc;
  }, {} as Record<T[number], HeroSlotConfig>);
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

  return {
    id,
    isActive,
    autoplayEligible,
    order,
    schedule: sanitizeSchedule(slideRaw.schedule, errors, `${slidePath}.schedule`),
    tracking: sanitizeTracking(slideRaw.tracking),
    devices: {
      desktop: {
        slots: sanitizeSlotsByKeys(
          desktopRaw.slots,
          DESKTOP_SLOT_KEYS,
          errors,
          `${slidePath}.devices.desktop.slots`,
        ),
      },
      tablet: {
        slots: sanitizeSlotsByKeys(
          tabletRaw.slots,
          TABLET_SLOT_KEYS,
          errors,
          `${slidePath}.devices.tablet.slots`,
        ),
      },
      mobile: {
        slots: sanitizeSlotsByKeys(
          mobileRaw.slots,
          MOBILE_SLOT_KEYS,
          errors,
          `${slidePath}.devices.mobile.slots`,
        ),
      },
    },
  };
}

export function createDefaultHeroSliderPayload(): HeroSliderPayload {
  return {
    version: 1,
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

  const rawSlides = Array.isArray(input.slides) ? input.slides : [];
  if (!Array.isArray(input.slides) && input.slides !== undefined) {
    errors.push("slides must be an array");
  }

  const slides = rawSlides.map((slide, index) => sanitizeSlide(slide, index, errors));

  return {
    value: {
      version: 1,
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
    version: 1,
    publishedAt: new Date().toISOString(),
    publishedBy,
  };
}
