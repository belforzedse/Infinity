"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { StoryViewer as LibStoryViewer } from "react-instagram-stories";
import type { User } from "react-instagram-stories";
import type { Story } from "@/types/story";
import { buildStoryMediaUrl } from "@/lib/story-media-url";

export interface StoriesViewerModalProps {
  stories: Story[];
  seenIds: Set<number>;
  isOpen: boolean;
  initialIndex: number;
  onClose: () => void;
  onStoryView: (storyId: number) => void;
}

function storiesToUsers(stories: Story[], seenIds: Set<number>): User[] {
  return stories.map((story) => {
    const mediaUrl = story.Media?.url ? buildStoryMediaUrl(story.Media.url) : "";
    const thumbnailUrl = story.Thumbnail?.url
      ? buildStoryMediaUrl(story.Thumbnail.url)
      : story.Media?.url
        ? buildStoryMediaUrl(story.Media.url)
        : "";

    return {
      id: String(story.id),
      username: story.Title,
      avatarUrl: thumbnailUrl || mediaUrl,
      hasUnreadStories: !seenIds.has(story.id),
      stories: [
        story.MediaType === "video"
          ? {
              id: `story-${story.id}`,
              type: "video" as const,
              src: mediaUrl,
              duration: story.DurationMs,
            }
          : {
              id: `story-${story.id}`,
              type: "image" as const,
              src: mediaUrl,
              alt: story.Title,
              duration: story.DurationMs,
            },
      ],
    };
  });
}

export default function StoriesViewerModal({
  stories,
  seenIds,
  isOpen,
  initialIndex,
  onClose,
  onStoryView,
}: StoriesViewerModalProps) {
  const users = useMemo(() => storiesToUsers(stories, seenIds), [stories, seenIds]);
  const lastStoryIdRef = useRef<number | null>(null);
  const storiesRef = useRef(stories);
  const seenIdsRef = useRef(seenIds);
  const onStoryViewRef = useRef(onStoryView);

  useLayoutEffect(() => {
    storiesRef.current = stories;
    seenIdsRef.current = seenIds;
    onStoryViewRef.current = onStoryView;
  }, [stories, seenIds, onStoryView]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  /**
   * Must stay referentially stable: `react-instagram-stories` StoryViewer's `useEffect` lists `onStoryChange`
   * in its dependency array and calls it whenever the reference changes — inline handlers loop updates.
   * Refs keep the latest `stories` / `seenIds` / `onStoryView` without changing the callback identity.
   */
  const handleStoryChange = useCallback((userIndex: number) => {
    const story = storiesRef.current[userIndex];
    if (!story) return;

    if (lastStoryIdRef.current === story.id) return;
    lastStoryIdRef.current = story.id;

    if (!seenIdsRef.current.has(story.id)) {
      onStoryViewRef.current(story.id);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <LibStoryViewer
      users={users}
      isOpen={isOpen}
      initialUserIndex={initialIndex}
      initialStoryIndex={0}
      onClose={onClose}
      onStoryChange={handleStoryChange}
      classNames={{
        overlay: "bg-black/95",
        progressBars: {
          bar: { fill: "bg-gradient-to-r from-pink-400 to-pink-600" },
        },
      }}
    />
  );
}
