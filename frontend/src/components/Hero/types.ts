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
  customWidth?: string; // e.g., "300px", "50%", "100%" - overrides width display
  customHeight?: string; // e.g., "300px", "50%", "100%" - overrides height display
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

/**
 * Desktop Layout - Uses flexible banner system
 * Structure:
 * - Left (7/12 width):
 *   - topLeftTextBanner: Text banner (top)
 *   - bottomActionBanners: Two action banners (bottom, in a grid)
 * - Right (5/12 width):
 *   - rightBanner: Large banner with background + absolutely-positioned foreground image
 */
export type DesktopLayout = {
  topLeftTextBanner: TextBannerSpec;
  bottomActionBannerLeft: ActionBannerSpec;
  bottomActionBannerRight: ActionBannerSpec;
  rightBanner: LeftBannerSpec;
};

/**
 * Tablet Layout - Advanced layout with hero square + text banner + action banners
 * Structure:
 * - heroBanner: Square with background + foreground (right side, LeftBannerSpec)
 * - primaryBanner: Text banner (top left, TextBannerSpec)
 * - bottomActionBannerLeft: Action banner (left column)
 * - bottomActionBannerRight: Action banner (left column)
 */
export type TabletLayout = {
  heroBanner: LeftBannerSpec;
  primaryBanner: TextBannerSpec;
  bottomActionBannerLeft: ActionBannerSpec;
  bottomActionBannerRight: ActionBannerSpec;
};

/**
 * Mobile Layout - Advanced layout with hero square + text banner + action banners
 * Structure:
 * - heroBanner: Square with background + foreground (LeftBannerSpec)
 * - primaryBanner: Text banner (TextBannerSpec)
 * - bottomActionBannerLeft: Action banner (responsive positioning)
 * - bottomActionBannerRight: Action banner (responsive positioning)
 */
export type MobileLayout = {
  heroBanner: LeftBannerSpec;
  primaryBanner: TextBannerSpec;
  bottomActionBannerLeft: ActionBannerSpec;
  bottomActionBannerRight: ActionBannerSpec;
};

// New Flexible Banner Types

export type BackgroundSpec = {
  type: "image" | "color";
  value: string; // image src or color value
  alt?: string; // only for images
  width?: string | number; // e.g., "300px", "50%"
  height?: string | number; // e.g., "300px", "50%"
  position?: string; // e.g., "center", "bottom center"
  backgroundSize?: string; // e.g., "cover", "contain", "100% 100%"
  className?: string; // e.g., "rounded-lg", for styling the background element
};

export type LeftBannerSpec = {
  background: BackgroundSpec;
  foregroundImage: BannerImageSpec;
};

export type ActionBannerButtonSpec = {
  label: string;
  href: string;
  className?: string;
  showArrow?: boolean; // Show arrow icon after label
  arrowClassName?: string; // Custom classes for arrow icon
};

export type ActionBannerSpec = {
  title: string;
  subtitle?: string;
  image: BannerImageSpec; // Positioned on left with absolute positioning
  button?: ActionBannerButtonSpec;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  colors?: ColorScheme;
  typography?: Typography;
  background?: BackgroundSpec; // Optional background config (color or image)
};

export type HeroSlideConfig = {
  id: string;
  desktop: DesktopLayout;
  mobile: MobileLayout;
};
