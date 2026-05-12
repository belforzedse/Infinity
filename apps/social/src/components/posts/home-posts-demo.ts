/**
 * Picsum placeholder feed for the home collage — opt-in via **`NEXT_PUBLIC_SOCIAL_HOME_POSTS_DEMO`**.
 * Same band pattern as the original static demo (`SLOT_TEMPLATE` × cycles).
 */

import { POST_CARD_LAYOUTS, type DesktopPostCardVariant } from "@/components/posts/post-card-variants";
import type { HomeFeedCardOverlay, HomeFeedPost } from "@/services/feed-post.service";

const SLOT_TEMPLATE: ReadonlyArray<{
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
  variant: DesktopPostCardVariant;
}> = [
  { colStart: 1, colEnd: 2, rowStart: 1, rowEnd: 2, variant: "sm" },
  { colStart: 2, colEnd: 3, rowStart: 1, rowEnd: 2, variant: "sm" },
  { colStart: 3, colEnd: 4, rowStart: 1, rowEnd: 2, variant: "sm" },
  { colStart: 4, colEnd: 5, rowStart: 1, rowEnd: 2, variant: "sm" },
  { colStart: 5, colEnd: 6, rowStart: 1, rowEnd: 2, variant: "sm" },
  { colStart: 6, colEnd: 7, rowStart: 1, rowEnd: 2, variant: "sm" },
  { colStart: 1, colEnd: 3, rowStart: 2, rowEnd: 4, variant: "xl" },
  { colStart: 3, colEnd: 4, rowStart: 2, rowEnd: 3, variant: "sm" },
  { colStart: 4, colEnd: 5, rowStart: 2, rowEnd: 3, variant: "sm" },
  { colStart: 3, colEnd: 4, rowStart: 3, rowEnd: 4, variant: "sm" },
  { colStart: 4, colEnd: 5, rowStart: 3, rowEnd: 4, variant: "sm" },
  { colStart: 5, colEnd: 7, rowStart: 2, rowEnd: 4, variant: "xl" },
] as const;

const DEMO_CYCLES = 3;

function buildPicsumSrc(seed: string, w: number, h: number): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

function buildDemoPosts(): HomeFeedPost[] {
  const out: HomeFeedPost[] = [];
  let ix = 0;
  for (let c = 0; c < DEMO_CYCLES; c += 1) {
    for (const slot of SLOT_TEMPLATE) {
      ix += 1;
      const variant = slot.variant;
      const hasVideo = ix % 7 === 0;
      const hasGal = ix % 11 === 0;
      const hasInf = variant === "xl" && ix % 5 === 0;
      const overlay: HomeFeedCardOverlay = hasInf
        ? "infinity"
        : hasVideo
          ? "video"
          : hasGal
            ? "gallery"
            : null;
      const seed = variant === "xl" ? `ig-xl-${ix}` : `ig-sm-${ix}`;
      const alt = variant === "xl" ? "پست نمونه — ایکس‌لارج" : "پست نمونه — اسمال";
      const { widthPx, imageHeightPx } = POST_CARD_LAYOUTS[variant];
      out.push({
        id: `demo-${c}-r${slot.rowStart}-c${slot.colStart}-${ix}`,
        desktopVariant: variant,
        imageSrc: buildPicsumSrc(seed, widthPx, imageHeightPx),
        imageAlt: `${alt} (${ix})`,
        likesCount: ix % 3 === 0 ? 1200 : 40 + ix,
        commentsCount: (ix * 3) % 200,
        overlay,
      });
    }
  }
  return out;
}

const DEMO_POSTS: readonly HomeFeedPost[] = buildDemoPosts();

/** When `true`, home feed uses Picsum demo tiles instead of Strapi `GET /posts`. */
export function isSocialHomePostsDemoEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_SOCIAL_HOME_POSTS_DEMO?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function getHomeDemoPosts(): readonly HomeFeedPost[] {
  return DEMO_POSTS;
}
