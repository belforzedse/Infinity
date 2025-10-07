import type { DesktopLayout } from "../types";
import * as slides from "./slides/desktop";

/**
 * Default desktop slides configuration
 * Add or remove slides by importing from ./slides/desktop
 */
export const desktopSlides: DesktopLayout[] = [
  slides.slide1,
  slides.slide2,
  slides.slide3,
];
