"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import type { Story } from "@/types/story";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useStoriesSeenState } from "@/hooks/use-stories-seen-state";
import { StoriesAvatarList } from "@/components/stories/stories-avatar-list";

const StoriesViewerModal = dynamic(
  () => import("@/components/stories/stories-viewer-modal"),
  { ssr: false },
);

export interface StoriesRailProps {
  stories: Story[];
}

/**
 * Social stories rail — layout per Figma Frame 92985; viewer/seen logic matches storefront.
 */
export function StoriesRail({ stories }: StoriesRailProps) {
  const { isAuthenticated } = useCurrentUser();
  const { seenIds, markSeen } = useStoriesSeenState(isAuthenticated);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!stories.length) return null;

  const handleAvatarClick = (index: number) => {
    setActiveIndex(index);
    setViewerOpen(true);
    const story = stories[index];
    if (story) markSeen(story.id);
  };

  const handleClose = () => setViewerOpen(false);

  const handleStoryView = (storyId: number) => markSeen(storyId);

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
          className="stories-rail h-20 w-full min-w-0 overflow-x-auto scrollbar-hide"
          dir="rtl"
        >
          <div className="flex h-20 w-max min-w-full flex-row items-center justify-start gap-4">
            <StoriesAvatarList
              stories={stories}
              seenIds={seenIds}
              onAvatarClick={handleAvatarClick}
            />
          </div>
        </div>
      </section>

      {viewerOpen && (
        <StoriesViewerModal
          stories={stories}
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
