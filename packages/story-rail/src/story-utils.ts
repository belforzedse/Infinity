import type { ResolveStoryMediaUrl, StoryRailPreview, StoryRailStory } from "./types";

export function getStorySortTimestamp(story: StoryRailStory): number {
  const value = story.updatedAt || story.createdAt;
  const timestamp = value ? Date.parse(value) : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function sortStoriesNewestFirst<TStory extends StoryRailStory>(stories: TStory[]): TStory[] {
  return [...stories].sort((a, b) => {
    const timestampDiff = getStorySortTimestamp(b) - getStorySortTimestamp(a);
    if (timestampDiff !== 0) return timestampDiff;
    return b.id - a.id;
  });
}

export function hasUsableMediaUrl(url?: string): url is string {
  return typeof url === "string" && url.trim().length > 0;
}

export function isSupportedImageUrl(url: string): boolean {
  return /\.(avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(url);
}

export function isSupportedVideoUrl(url: string): boolean {
  return /\.(m3u8|mov|mp4|m4v|ogg|ogv|webm)(?:[?#].*)?$/i.test(url);
}

export function isImageStory(story: StoryRailStory): boolean {
  const mediaUrl = story.Media?.url;
  if (story.MediaType !== "image" || !hasUsableMediaUrl(mediaUrl)) return false;
  const mime = story.Media?.mime;
  return mime ? mime.startsWith("image/") : isSupportedImageUrl(mediaUrl);
}

export function isVideoStory(story: StoryRailStory): boolean {
  const mediaUrl = story.Media?.url;
  if (story.MediaType !== "video" || !hasUsableMediaUrl(mediaUrl)) return false;
  const mime = story.Media?.mime;
  return mime ? mime.startsWith("video/") : isSupportedVideoUrl(mediaUrl);
}

export function getStoryRailPreview(
  story: StoryRailStory,
  resolveMediaUrl: ResolveStoryMediaUrl,
): StoryRailPreview {
  if (story.Thumbnail?.url) {
    return { mode: "image", url: resolveMediaUrl(story.Thumbnail.url) };
  }

  const mediaUrl = story.Media?.url;
  if (!mediaUrl) return { mode: "empty" };

  if (story.MediaType === "video" && isVideoStory(story)) {
    return { mode: "video", src: resolveMediaUrl(mediaUrl) };
  }

  if (story.MediaType === "image" && isImageStory(story)) {
    return { mode: "image", url: resolveMediaUrl(mediaUrl) };
  }

  return { mode: "empty" };
}
