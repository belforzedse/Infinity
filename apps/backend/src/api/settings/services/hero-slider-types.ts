import {
  DESKTOP_SLOT_KEYS,
  TABLET_SLOT_KEYS,
  MOBILE_SLOT_KEYS,
  ALLOWED_FONT_FAMILIES,
  ALLOWED_FONT_SIZES,
  ALLOWED_FONT_WEIGHTS,
  ALLOWED_LINE_HEIGHTS,
  ALLOWED_LETTER_SPACINGS,
} from "./hero-slider-defaults";

type DesktopSlotKey = (typeof DESKTOP_SLOT_KEYS)[number];
type TabletSlotKey = (typeof TABLET_SLOT_KEYS)[number];
type MobileSlotKey = (typeof MOBILE_SLOT_KEYS)[number];

/**
 * Token type aliases use the conditional "typeof ALLOWED_... extends Set<infer T> ? T : never"
 * to extract the element type from each Set of allowed values, so the token becomes the union
 * of that Set's entries. Corresponding constants: ALLOWED_FONT_FAMILIES, ALLOWED_FONT_SIZES,
 * ALLOWED_FONT_WEIGHTS, ALLOWED_LINE_HEIGHTS, ALLOWED_LETTER_SPACINGS.
 */
type HeroFontFamilyToken = (typeof ALLOWED_FONT_FAMILIES extends Set<infer T> ? T : never);
type HeroFontSizeToken = (typeof ALLOWED_FONT_SIZES extends Set<infer T> ? T : never);
type HeroFontWeightToken = (typeof ALLOWED_FONT_WEIGHTS extends Set<infer T> ? T : never);
type HeroLineHeightToken = (typeof ALLOWED_LINE_HEIGHTS extends Set<infer T> ? T : never);
type HeroLetterSpacingToken =
  (typeof ALLOWED_LETTER_SPACINGS extends Set<infer T> ? T : never);

export type HeroSlotLink = {
  type: "internal" | "external";
  href: string;
};
export type HeroContentAlignment = "top" | "center" | "bottom";
export type HeroBackgroundType = "color" | "image";
export type HeroOverflowEdge = "top" | "right" | "bottom" | "left";

export type HeroImageOverflow = {
  enabled: boolean;
  edge: HeroOverflowEdge;
  amountPx: number;
  offsetXPercent: number;
  offsetYPercent: number;
  widthPercent: number;
};

export type HeroTracking = {
  campaign: string;
  source: string;
  medium: string;
  content: string;
  custom: Record<string, string>;
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
  foregroundOverflow: HeroImageOverflow;
  link: HeroSlotLink | null;
  tracking: HeroTracking;
};

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
  imageOverflow: HeroImageOverflow;
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

export type HeroSlideSchedule = {
  timezone: "Asia/Tehran";
  startAtUtc?: string;
  endAtUtc?: string;
};

export type HeroSlideDevices = {
  desktop: {
    slots: {
      topLeftTextBanner: HeroHeadlineSlot;
      bottomActionBannerLeft: HeroCardSlot;
      bottomActionBannerRight: HeroCardSlot;
      rightBanner: HeroMainVisualSlot;
    };
  };
  tablet: {
    slots: {
      primaryBanner: HeroHeadlineSlot;
      bottomActionBannerLeft: HeroCardSlot;
      bottomActionBannerRight: HeroCardSlot;
      heroBanner: HeroMainVisualSlot;
    };
  };
  mobile: {
    slots: {
      primaryBanner: HeroHeadlineSlot;
      bottomActionBannerLeft: HeroCardSlot;
      bottomActionBannerRight: HeroCardSlot;
      heroBanner: HeroMainVisualSlot;
    };
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
  version: 2;
  autoplayIntervalMs: number;
  slides: HeroSlideConfig[];
};

export type HeroSliderMeta = {
  version: 2;
  publishedAt: string;
  publishedBy: number | null;
};

export type HeroSliderSanitizationResult = {
  value: HeroSliderPayload;
  errors: string[];
};
