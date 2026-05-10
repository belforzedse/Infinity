/**
 * Story domain types — aligned with Strapi `story` / `story-seen` (same as storefront).
 */

export type StoryMediaType = "image" | "video";

export interface StoryMediaAsset {
  id: number;
  url: string;
  alternativeText?: string;
  width?: number;
  height?: number;
  mime?: string;
  formats?: {
    large?: { url: string };
    medium?: { url: string };
    small?: { url: string };
    thumbnail?: { url: string };
  };
}

export interface StoryOverlay {
  id: string;
  type: "text" | "sticker" | "shape";
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  content?: string;
  fontSize?: number;
  fontColor?: string;
  fontFamily?: string;
  imageUrl?: string;
}

export interface Story {
  id: number;
  Title: string;
  Slug: string;
  IsActive: boolean;
  SortOrder: number;
  MediaType: StoryMediaType;
  Media?: StoryMediaAsset;
  Thumbnail?: StoryMediaAsset;
  StartAt?: string;
  EndAt?: string;
  DurationMs: number;
  CtaLabel?: string;
  CtaUrl?: string;
  Overlays?: StoryOverlay[];
  createdAt: string;
  updatedAt: string;
}
