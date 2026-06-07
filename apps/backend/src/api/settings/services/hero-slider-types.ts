export type HeroSlotLink = {
  type: "internal" | "external";
  href: string;
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
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
};

export type HeroSlideSchedule = {
  timezone: "Asia/Tehran";
  startAtUtc?: string;
  endAtUtc?: string;
};

export type HeroSlideConfig = {
  id: string;
  imageUrl: string;
  imageAlt: string;
  mobileImageUrl: string;
  mobileImageAlt: string;
  link: HeroSlotLink | null;
  isActive: boolean;
  autoplayEligible: boolean;
  order: number;
  schedule: HeroSlideSchedule;
  tracking: HeroTracking;
};

export type HeroSliderPayload = {
  version: 3;
  autoplayIntervalMs: number;
  slides: HeroSlideConfig[];
};

export type HeroSliderMeta = {
  version: 3;
  publishedAt: string;
  publishedBy: number | null;
};

export type HeroSliderSanitizationResult = {
  value: HeroSliderPayload;
  errors: string[];
};
