"use client";

import { useCallback } from "react";
import { StoryRail as SharedStoryRail } from "@repo/story-rail";
import type { Story } from "@/types/story";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useStoriesSeenState } from "@/hooks/useStoriesSeenState";
import { IMAGE_BASE_URL } from "@/constants/api";

interface StoriesRailProps {
  stories: Story[];
}

function buildMediaUrl(url: string): string {
  if (url.startsWith("http")) return url;
  const base = (IMAGE_BASE_URL || "").replace(/\/+$/, "");
  const path = url.replace(/^\/+/, "");
  if (!base) return `/${path}`;
  return `${base}/${path}`;
}

export default function StoriesRail({ stories }: StoriesRailProps) {
  const { isAuthenticated } = useCurrentUser();
  const { seenIds, markSeen } = useStoriesSeenState(isAuthenticated);

  const handleStoryView = useCallback((storyId: number) => {
    void markSeen(storyId);
  }, [markSeen]);

  return (
    <SharedStoryRail
      stories={stories}
      seenIds={seenIds}
      onMarkSeen={handleStoryView}
      resolveMediaUrl={buildMediaUrl}
      dir="rtl"
      emptyPreviewLabel="ویدیو"
      unavailableText="Story unavailable"
    />
  );
}
