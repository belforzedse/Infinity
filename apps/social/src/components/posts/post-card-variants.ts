/**
 * Pixel layout for each `PostCard` variant (Figma infinity-gram post cards).
 * Width/height apply to the image area; card column gap is separate.
 * Desktop feed uses **xl** and **sm** only.
 */

export type PostCardVariant = "xl" | "sm" | "mobile-lg" | "mobile-sm";

/** Desktop-only variants (homepage grid, authoring) before mobile mapping. */
export type DesktopPostCardVariant = "xl" | "sm";

export type PostCardLayout = {
  /** Card column width (matches image width). */
  widthPx: number;
  /** Fixed image height. */
  imageHeightPx: number;
  /** Vertical gap between image and action row (Figma column `gap`). */
  columnGapPx: number;
};

export const POST_CARD_LAYOUTS: Readonly<Record<PostCardVariant, PostCardLayout>> = {
  xl: { widthPx: 383, imageHeightPx: 536, columnGapPx: 10 },
  sm: { widthPx: 184, imageHeightPx: 229, columnGapPx: 10 },
  /** Figma responsive `POST 1` (node `78:3592`). */
  "mobile-lg": { widthPx: 362, imageHeightPx: 484, columnGapPx: 10 },
  /** Same footprint as `sm` (product decision: mobile compact = desktop small). */
  "mobile-sm": { widthPx: 184, imageHeightPx: 229, columnGapPx: 10 },
} as const;

/** Allowed overshoot above Figma `widthPx` when using `widthMode="fluid"` (tablet / narrow grids). */
export const POST_CARD_FLUID_MAX_EXTRA_PX = 10;

/** Default fluid `max-width` = design width + `POST_CARD_FLUID_MAX_EXTRA_PX`. */
export function fluidMaxWidthCapPx(variant: PostCardVariant): number {
  return POST_CARD_LAYOUTS[variant].widthPx + POST_CARD_FLUID_MAX_EXTRA_PX;
}

/**
 * Maps a desktop post size to the mobile `PostCard` variant:
 * - `xl` → `mobile-lg`
 * - `sm` → `mobile-sm`
 */
export function toMobilePostCardVariant(
  variant: DesktopPostCardVariant,
): "mobile-lg" | "mobile-sm" {
  return variant === "xl" ? "mobile-lg" : "mobile-sm";
}
