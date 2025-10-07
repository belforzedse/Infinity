export type BannerImageSpec = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  href?: string;
  loading?: "eager" | "lazy";
  priority?: boolean;
  objectPosition?: string;
};

export type ColorScheme = {
  background?: string;
  titleColor?: string;
  subtitleColor?: string;
};

export type Typography = {
  titleFont?: string;
  subtitleFont?: string;
  titleSize?: string;
  subtitleSize?: string;
  titleWeight?: string;
  subtitleWeight?: string;
  titleLeading?: string;
  subtitleLeading?: string;
  titleTracking?: string;
  subtitleTracking?: string;
};

export type TextBannerSpec = {
  title: string;
  subtitle?: string;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  colors?: ColorScheme;
  typography?: Typography;
};

export type DesktopLayout = {
  textBanner: TextBannerSpec;
  belowLeft: BannerImageSpec;
  belowRight: BannerImageSpec;
  side: BannerImageSpec;
};

export type MobileLayout = {
  heroDesktop: BannerImageSpec;
  heroMobile: BannerImageSpec;
  secondaryPrimary: BannerImageSpec;
  secondaryTop: BannerImageSpec;
  secondaryBottom: BannerImageSpec;
};

export type HeroSlideConfig = {
  id: string;
  desktop: DesktopLayout;
  mobile: MobileLayout;
};
