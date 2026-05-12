/**
 * Create-post flow: URL `?size=`, cover aspect preview, and Strapi `Size` enum mapping.
 * Keeps dimensions aligned with [`POST_CARD_LAYOUTS`](./post-card-variants.ts).
 */

import { POST_CARD_LAYOUTS } from "@/components/posts/post-card-variants";

export type PostCreateSizeCode = "xl" | "sm";

export const POST_CREATE_SIZE_CODES = new Set<PostCreateSizeCode>(["xl", "sm"]);

/** Strapi `api::post.post.Size` values used for new posts (legacy Medium/Large may exist in DB). */
export const POST_SIZE_TO_STRAPI = {
  xl: "X Large",
  sm: "Small",
} as const satisfies Record<PostCreateSizeCode, "X Large" | "Small">;

export function parsePostCreateSizeParam(raw: string | null): PostCreateSizeCode | null {
  if (!raw) return null;
  const n = raw.toLowerCase();
  return n === "xl" || n === "sm" ? (n as PostCreateSizeCode) : null;
}

/** Desktop pixel box for size-picker cards and cover `aspect-ratio` (image area). */
export function coverAspectFromLayout(code: PostCreateSizeCode): { w: number; h: number } {
  const L = POST_CARD_LAYOUTS[code];
  return { w: L.widthPx, h: L.imageHeightPx };
}

/** Same as desktop layout pixels — used by add-post size step + content cover preview. */
export const COVER_ASPECT_BY_CODE: Readonly<Record<PostCreateSizeCode, { w: number; h: number }>> = {
  xl: coverAspectFromLayout("xl"),
  sm: coverAspectFromLayout("sm"),
} as const;

/** Mobile size-picker: XL scaled to `mobile-lg` width; SM matches desktop footprint. */
export const SIZE_PICKER_MOBILE_PREVIEW: Readonly<Record<PostCreateSizeCode, { w: number; h: number }>> = {
  xl: {
    w: POST_CARD_LAYOUTS["mobile-lg"].widthPx,
    h: Math.round(
      (POST_CARD_LAYOUTS.xl.imageHeightPx * POST_CARD_LAYOUTS["mobile-lg"].widthPx) /
        POST_CARD_LAYOUTS.xl.widthPx,
    ),
  },
  sm: coverAspectFromLayout("sm"),
} as const;
