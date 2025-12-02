import type { MobileLayout } from "../types";
import * as slides from "./slides/mobile";

/**
 * Default mobile slides configuration
 * Add or remove slides by importing from ./slides/mobile
 */
export const mobileSlides: MobileLayout[] = [
  slides.slide1,
  slides.slide2,

];
