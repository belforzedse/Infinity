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
};

export type TextBannerSpec = {
  title: string;
  subtitle?: string;
  className: string;
  titleClassName: string;
  subtitleClassName?: string;
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

