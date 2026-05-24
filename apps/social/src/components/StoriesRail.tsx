"use client";

import { useCallback } from "react";
import { StoryRail as SharedStoryRail } from "@repo/story-rail";
import type { Story } from "@/types/story";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useStoriesSeenState } from "@/hooks/use-stories-seen-state";
import { InfinityMarkCircle } from "@/components/InfinityMarkCircle";
import { buildStoryMediaUrl } from "@/lib/story-media-url";

export interface StoriesRailProps {
  stories: Story[];
}

const MOBILE_INFINITY_MARK_PX = 15;

function renderSocialMobileBadge() {
  return (
    <div
      dir="ltr"
      className="absolute bottom-[2.13%] right-[4.65%] flex flex-row items-center gap-[3px]"
    >
      <span className="flex w-9 shrink-0 items-center text-right font-peyda text-[10px] font-medium leading-[21px] text-white">
        اینفینیتی
      </span>
      <InfinityMarkCircle circleSize={20} markSize={MOBILE_INFINITY_MARK_PX} />
    </div>
  );
}

/**
 * Social adapter for the shared story rail package.
 */
export function StoriesRail({ stories }: StoriesRailProps) {
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
      resolveMediaUrl={buildStoryMediaUrl}
      heading="داستان ها"
      dir="rtl"
      renderMobileBadge={renderSocialMobileBadge}
      emptyPreviewLabel="ویدیو"
      unavailableText="Story unavailable"
    />
  );
}
