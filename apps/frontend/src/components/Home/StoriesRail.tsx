"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import type { Story } from "@/types/story";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useStoriesSeenState } from "@/hooks/useStoriesSeenState";
import { StoriesAvatarList } from "@/components/Stories/StoriesViewer";

const StoriesViewer = dynamic(
  () => import("@/components/Stories/StoriesViewer"),
  { ssr: false }
);

interface StoriesRailProps {
  stories: Story[];
}

export default function StoriesRail({ stories }: StoriesRailProps) {
  const { isAuthenticated } = useCurrentUser();
  const { seenIds, markSeen } = useStoriesSeenState(isAuthenticated);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!stories.length) return null;

  const handleAvatarClick = (index: number) => {
    setActiveIndex(index);
    setViewerOpen(true);
    // Mark the opened story as seen immediately
    const story = stories[index];
    if (story) markSeen(story.id);
  };

  const handleClose = () => setViewerOpen(false);

  const handleStoryView = (storyId: number) => markSeen(storyId);

  return (
    <>
      {/* Horizontal scrollable rail */}
      <div className="stories-rail w-full overflow-x-auto pb-2 pt-1 scrollbar-hide">
        <div className="flex w-max gap-1 px-2">
          <StoriesAvatarList
            stories={stories}
            seenIds={seenIds}
            onAvatarClick={handleAvatarClick}
          />
        </div>
      </div>

      {/* Fullscreen viewer — dynamically loaded only when open */}
      {viewerOpen && (
        <StoriesViewer
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
