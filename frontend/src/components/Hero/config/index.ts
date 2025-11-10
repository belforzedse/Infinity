import type { DesktopLayout, MobileLayout, TabletLayout } from "../types";
import { desktopSlides } from "./desktopSlides";
import { mobileSlides } from "./mobileSlides";
import { tabletSlides } from "./tabletSlides";

export interface SliderConfig {
  desktop: DesktopLayout[];
  tablet: TabletLayout[];
  mobile: MobileLayout[];
  autoplayInterval?: number;
}

// Default configuration - easily replaceable
export const defaultSliderConfig: SliderConfig = {
  desktop: desktopSlides,
  tablet: tabletSlides,
  mobile: mobileSlides,
  autoplayInterval: 3600000, // 1 hour in milliseconds
};

// Export individual configs for flexibility
export { desktopSlides, tabletSlides, mobileSlides };
export type { DesktopLayout, MobileLayout, TabletLayout };
