import type { DesktopLayout, MobileLayout } from "../types";
import { desktopSlides } from "./desktopSlides";
import { mobileSlides } from "./mobileSlides";

export interface SliderConfig {
  desktop: DesktopLayout[];
  mobile: MobileLayout[];
  autoplayInterval?: number;
}

// Default configuration - easily replaceable
export const defaultSliderConfig: SliderConfig = {
  desktop: desktopSlides,
  mobile: mobileSlides,
  autoplayInterval: 7000,
};

// Export individual configs for flexibility
export { desktopSlides, mobileSlides };
export type { DesktopLayout, MobileLayout };
