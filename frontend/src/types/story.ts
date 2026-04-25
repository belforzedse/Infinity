/**
 * Story domain types.
 * These map directly to the Strapi `story` and `story-seen` content types.
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

/** A single overlay layer persisted in the `Overlays` JSON field. */
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

export interface StorySeen {
  id: number;
  story: Pick<Story, "id" | "Title">;
  SeenAt: string;
  createdAt: string;
}

export interface StoryListParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  search?: string;
  isActive?: boolean;
}

export interface CreateStoryData {
  Title: string;
  MediaType: StoryMediaType;
  IsActive?: boolean;
  SortOrder?: number;
  Media?: number;
  Thumbnail?: number;
  StartAt?: string;
  EndAt?: string;
  DurationMs?: number;
  CtaLabel?: string;
  CtaUrl?: string;
  Overlays?: StoryOverlay[];
}

export type UpdateStoryData = Partial<CreateStoryData>;
