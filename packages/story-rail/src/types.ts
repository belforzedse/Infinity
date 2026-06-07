import type { ReactNode } from "react";

export type StoryRailMediaType = "image" | "video";

export interface StoryRailMediaAsset {
  id?: number | string;
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

export interface StoryRailStory {
  id: number;
  Title: string;
  MediaType: StoryRailMediaType;
  Media?: StoryRailMediaAsset;
  Thumbnail?: StoryRailMediaAsset;
  DurationMs: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ResolveStoryMediaUrl = (url: string) => string;

export type StoryRailPreview =
  | { mode: "image"; url: string }
  | { mode: "video"; src: string }
  | { mode: "empty" };

export interface StoryRailMobileBadgeRenderArgs<TStory extends StoryRailStory> {
  story: TStory;
  isSeen: boolean;
}

export interface StoryRailClassNames {
  root?: string;
  heading?: string;
  scroller?: string;
  scrollerInner?: string;
  list?: string;
  avatarButton?: string;
  mobileCard?: string;
  desktopRing?: string;
}

export interface StoryViewerClassNames {
  overlay?: string;
  progressFill?: string;
}

export type StoryRailMobileLayout = "card" | "avatar";

export interface StoriesAvatarListProps<TStory extends StoryRailStory = StoryRailStory> {
  stories: TStory[];
  seenIds: Set<number>;
  onAvatarClick: (index: number) => void;
  resolveMediaUrl: ResolveStoryMediaUrl;
  mobileLayout?: StoryRailMobileLayout;
  renderMobileBadge?: (args: StoryRailMobileBadgeRenderArgs<TStory>) => ReactNode;
  emptyPreviewLabel?: string;
  classNames?: Pick<StoryRailClassNames, "list" | "avatarButton" | "mobileCard" | "desktopRing">;
}

export interface StoriesViewerModalProps<TStory extends StoryRailStory = StoryRailStory> {
  stories: TStory[];
  seenIds: Set<number>;
  isOpen: boolean;
  initialIndex: number;
  onClose: () => void;
  onStoryView: (storyId: number) => void;
  resolveMediaUrl: ResolveStoryMediaUrl;
  unavailableText?: string;
  classNames?: StoryViewerClassNames;
}

export interface StoryRailProps<TStory extends StoryRailStory = StoryRailStory> {
  stories: TStory[];
  seenIds: Set<number>;
  onMarkSeen: (storyId: number) => void | Promise<void>;
  resolveMediaUrl: ResolveStoryMediaUrl;
  heading?: ReactNode;
  headingId?: string;
  dir?: "rtl" | "ltr";
  className?: string;
  classNames?: StoryRailClassNames;
  viewerClassNames?: StoryViewerClassNames;
  mobileLayout?: StoryRailMobileLayout;
  renderMobileBadge?: (args: StoryRailMobileBadgeRenderArgs<TStory>) => ReactNode;
  emptyPreviewLabel?: string;
  unavailableText?: string;
}
