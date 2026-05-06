import type { HeroTextStyle } from "./heroSlider";

export type HeroHeadlineStylePreset = {
  id: string;
  label: string;
  titleStyle: Partial<HeroTextStyle>;
  subtitleStyle: Partial<HeroTextStyle>;
};

export type HeroCardStylePreset = {
  id: string;
  label: string;
  titleStyle: Partial<HeroTextStyle>;
  buttonStyle: Partial<HeroTextStyle>;
};

/** Style presets for headline slots (title + subtitle). Apply via "پکیج استایل" in HeadlineEditor. */
export const HERO_HEADLINE_STYLE_PRESETS: HeroHeadlineStylePreset[] = [
  {
    id: "minimal",
    label: "مینیمال",
    titleStyle: {
      fontFamily: "font-kaghaz",
      fontSize: "text-2xl",
      fontWeight: "font-medium",
      lineHeight: "leading-tight",
      letterSpacing: "tracking-normal",
      color: "#1e293b",
    },
    subtitleStyle: {
      fontFamily: "font-kaghaz",
      fontSize: "text-base",
      fontWeight: "font-normal",
      lineHeight: "leading-relaxed",
      letterSpacing: "tracking-normal",
      color: "#64748b",
    },
  },
  {
    id: "bold",
    label: "بولد",
    titleStyle: {
      fontFamily: "font-kaghaz",
      fontSize: "text-3xl",
      fontWeight: "font-bold",
      lineHeight: "leading-tight",
      letterSpacing: "tracking-tight",
      color: "#0f172a",
    },
    subtitleStyle: {
      fontFamily: "font-kaghaz",
      fontSize: "text-lg",
      fontWeight: "font-semibold",
      lineHeight: "leading-snug",
      letterSpacing: "tracking-normal",
      color: "#475569",
    },
  },
  {
    id: "elegant",
    label: "الگنت",
    titleStyle: {
      fontFamily: "font-rokh",
      fontSize: "text-xl",
      fontWeight: "font-medium",
      lineHeight: "leading-relaxed",
      letterSpacing: "tracking-wide",
      color: "#334155",
    },
    subtitleStyle: {
      fontFamily: "font-rokh",
      fontSize: "text-sm",
      fontWeight: "font-normal",
      lineHeight: "leading-relaxed",
      letterSpacing: "tracking-wide",
      color: "#64748b",
    },
  },
];

/** Style presets for card slots (title + button). Apply via "پکیج استایل" in CardEditor. */
export const HERO_CARD_STYLE_PRESETS: HeroCardStylePreset[] = [
  {
    id: "minimal",
    label: "مینیمال",
    titleStyle: {
      fontFamily: "font-peyda-fanum",
      fontSize: "text-base",
      fontWeight: "font-medium",
      lineHeight: "leading-tight",
      letterSpacing: "tracking-normal",
      color: "#1e293b",
    },
    buttonStyle: {
      fontFamily: "font-peyda-fanum",
      fontSize: "text-sm",
      fontWeight: "font-normal",
      lineHeight: "leading-normal",
      letterSpacing: "tracking-normal",
      color: "#ffffff",
    },
  },
  {
    id: "bold",
    label: "بولد",
    titleStyle: {
      fontFamily: "font-peyda-fanum",
      fontSize: "text-xl",
      fontWeight: "font-bold",
      lineHeight: "leading-tight",
      letterSpacing: "tracking-tight",
      color: "#0f172a",
    },
    buttonStyle: {
      fontFamily: "font-peyda-fanum",
      fontSize: "text-base",
      fontWeight: "font-semibold",
      lineHeight: "leading-normal",
      letterSpacing: "tracking-wide",
      color: "#ffffff",
    },
  },
  {
    id: "elegant",
    label: "الگنت",
    titleStyle: {
      fontFamily: "font-rokh",
      fontSize: "text-lg",
      fontWeight: "font-semibold",
      lineHeight: "leading-relaxed",
      letterSpacing: "tracking-wide",
      color: "#334155",
    },
    buttonStyle: {
      fontFamily: "font-rokh",
      fontSize: "text-sm",
      fontWeight: "font-medium",
      lineHeight: "leading-normal",
      letterSpacing: "tracking-wide",
      color: "#ffffff",
    },
  },
];
