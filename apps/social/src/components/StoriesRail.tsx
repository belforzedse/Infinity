"use client";

import React, { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Story } from "@/types/story";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useStoriesSeenState } from "@/hooks/use-stories-seen-state";
import { StoriesAvatarList } from "@/components/stories/StoriesAvatarList";

const StoriesViewerModal = dynamic(
  () => import("@/components/stories/StoriesViewerModal"),
  { ssr: false },
);

export interface StoriesRailProps {
  stories: Story[];
}

function getStorySortTimestamp(story: Story): number {
  const value = story.updatedAt || story.createdAt;
  const timestamp = value ? Date.parse(value) : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortStoriesNewestFirst(stories: Story[]): Story[] {
  return [...stories].sort((a, b) => {
    const timestampDiff = getStorySortTimestamp(b) - getStorySortTimestamp(a);
    if (timestampDiff !== 0) return timestampDiff;
    return b.id - a.id;
  });
}

/**
 * Social stories rail — layout per Figma Frame 92985; viewer/seen logic matches storefront.
 */
export function StoriesRail({ stories }: StoriesRailProps) {
  const { isAuthenticated } = useCurrentUser();
  const { seenIds, markSeen } = useStoriesSeenState(isAuthenticated);
  const orderedStories = useMemo(() => sortStoriesNewestFirst(stories), [stories]);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleClose = useCallback(() => setViewerOpen(false), []);

  const handleStoryView = useCallback((storyId: number) => {
    void markSeen(storyId);
  }, [markSeen]);

  const handleAvatarClick = useCallback(
    (index: number) => {
      setActiveIndex(index);
      setViewerOpen(true);
      const story = orderedStories[index];
      if (story) void markSeen(story.id);
    },
    [orderedStories, markSeen],
  );

  if (!orderedStories.length) return null;

  return (
    <>
      {/* Frame 92985: column, items-end, gap 20px, padding 0 */}
      <section
        className="flex w-full flex-col items-end gap-5 p-0"
        dir="rtl"
        aria-labelledby="stories-rail-heading"
      >
        <h2
          id="stories-rail-heading"
          className="self-stretch text-right font-peyda text-2xl font-bold leading-[21px] text-[#424242]"
        >
          داستان ها
        </h2>

        {/* Row RTL: justify-start packs toward main-start (right); justify-end incorrectly sent avatars to the left */}
        <div
          className="stories-rail min-h-[188px] w-full min-w-0 overflow-x-auto scrollbar-hide lg:min-h-0 lg:h-20"
          dir="rtl"
        >
          <div className="flex min-h-[188px] w-max min-w-full flex-row items-stretch justify-start gap-4 lg:min-h-0 lg:h-20 lg:items-center">
            <StoriesAvatarList
              stories={orderedStories}
              seenIds={seenIds}
              onAvatarClick={handleAvatarClick}
            />
          </div>
        </div>
      </section>

      {viewerOpen && (
        <StoriesViewerModal
          stories={orderedStories}
          seenIds={seenIds}
          isOpen={viewerOpen}
          initialIndex={activeIndex}
          onClose={handleClose}
          onStoryView={handleStoryView}
        />
      )}
    </>
  );
}
