export const DEFAULT_AUTOPLAY_INTERVAL_MS = 600000;
export const MIN_AUTOPLAY_INTERVAL_MS = 3000;
export const MAX_AUTOPLAY_INTERVAL_MS = 3600000;
export const MIN_HEADLINE_BOTTOM_MARGIN_PX = 0;
export const MAX_HEADLINE_BOTTOM_MARGIN_PX = 160;
export const MAX_TEXT_LENGTH = 280;

export const DESKTOP_SLOT_KEYS = [
  "topLeftTextBanner",
  "bottomActionBannerLeft",
  "bottomActionBannerRight",
  "rightBanner",
] as const;

export const TABLET_SLOT_KEYS = [
  "primaryBanner",
  "bottomActionBannerLeft",
  "bottomActionBannerRight",
  "heroBanner",
] as const;

export const MOBILE_SLOT_KEYS = [
  "primaryBanner",
  "bottomActionBannerLeft",
  "bottomActionBannerRight",
  "heroBanner",
] as const;

export const ALLOWED_LINK_TYPES = new Set(["internal", "external"] as const);
export const ALLOWED_CONTENT_ALIGNMENTS = new Set(["top", "center", "bottom"] as const);
export const ALLOWED_BACKGROUND_TYPES = new Set(["color", "image"] as const);
export const ALLOWED_FONT_FAMILIES = new Set([
  "font-kaghaz",
  "font-rokh",
  "font-peyda",
  "font-peyda-fanum",
] as const);
export const ALLOWED_FONT_SIZES = new Set([
  "text-xs",
  "text-sm",
  "text-base",
  "text-[26px]",
  "text-lg",
  "text-lg sm:text-2xl",
  "text-xl",
  "text-xs sm:text-sm",
  "text-2xl",
  "text-3xl",
  "sl:text-[65px] text-[40px]",
  "sl:text-[40px] text-xl",
  "lg:text-[24px] 2xl:text-[28px]",
  "lg:text-[40px] 2xl:text-[48px]",
  "lg:text-[44px] 2xl:text-[54px]",
  "text-xl sm:text-2xl md:text-3xl",
  "text-sm sm:text-base md:text-lg",
  "lg:text-[30px] 2xl:text-[34px]",
  "lg:text-[48px] 2xl:text-[50px]",
  "lg:text-[26px] 2xl:text-[30px]",
  "text-[30px]",
  "text-[20px]",
] as const);
export const ALLOWED_FONT_WEIGHTS = new Set([
  "font-normal",
  "font-medium",
  "font-semibold",
  "font-bold",
  "font-extrabold",
] as const);
export const ALLOWED_LINE_HEIGHTS = new Set([
  "leading-tight",
  "leading-snug",
  "leading-normal",
  "leading-relaxed",
  "leading-[110%]",
  "leading-[150%]",
] as const);
export const ALLOWED_LETTER_SPACINGS = new Set([
  "tracking-tight",
  "tracking-normal",
  "tracking-wide",
] as const);
