import type { TabletLayout } from "../types";
import * as slides from "./slides/tablet";

/**
 * Default tablet slides configuration
 * Tablets (768px - 1189px) use custom TabletLayout with unique positioning:
 * - Wide banner on top
 * - Big square on the right
 * - 2 smaller banners stacked on the left
 * Add or remove slides by importing from ./slides/tablet
 */
export const tabletSlides: TabletLayout[] = [slides.slide1, slides.slide2];
