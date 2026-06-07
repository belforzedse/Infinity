/**
 * Hero slider schema – public API.
 * Implementation is split into:
 * - hero-slider-defaults.ts: constants
 * - hero-slider-types.ts: type definitions
 * - hero-slider-sanitizers.ts: sanitization and validation
 */

export type {
  HeroSlotLink,
  HeroTracking,
  HeroSlideSchedule,
  HeroSlideConfig,
  HeroSliderPayload,
  HeroSliderMeta,
  HeroSliderSanitizationResult,
} from "./hero-slider-types";

export {
  createDefaultHeroSliderPayload,
  sanitizeHeroSliderPayload,
  normalizeStoredHeroSliderPayload,
  createHeroSliderMeta,
} from "./hero-slider-sanitizers";
