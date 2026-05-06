"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { StoryViewer as LibStoryViewer } from "react-instagram-stories";
import type { User } from "react-instagram-stories";
import type { Story } from "@/types/story";
import { IMAGE_BASE_URL } from "@/constants/api";

interface StoriesViewerProps {
  stories: Story[];
  seenIds: Set<number>;
  isOpen: boolean;
  initialIndex: number;
  onClose: () => void;
  onStoryView: (storyId: number) => void;
}

function buildMediaUrl(url: string): string {
  if (url.startsWith("http")) return url;
  const base = (IMAGE_BASE_URL || "").replace(/\/+$/, "");
  const path = url.replace(/^\/+/, "");
  if (!base) return `/${path}`;
  return `${base}/${path}`;
}

function storiesToUsers(stories: Story[], seenIds: Set<number>): User[] {
  return stories.map((story) => {
    const mediaUrl = story.Media?.url ? buildMediaUrl(story.Media.url) : "";
    const thumbnailUrl = story.Thumbnail?.url
      ? buildMediaUrl(story.Thumbnail.url)
      : story.Media?.url
      ? buildMediaUrl(story.Media.url)
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

export function StoriesAvatarList({
  stories,
  seenIds,
  onAvatarClick,
}: {
  stories: Story[];
  seenIds: Set<number>;
  onAvatarClick: (index: number) => void;
}) {
  return (
    <div className="flex items-start gap-5 px-2">
      {stories.map((story, index) => {
        const mediaUrl = story.Thumbnail?.url ?? story.Media?.url ?? "";
        const avatarUrl = mediaUrl ? buildMediaUrl(mediaUrl) : "";
        const isSeen = seenIds.has(story.id);

        return (
          <button
            key={story.id}
            type="button"
            onClick={() => onAvatarClick(index)}
            className="flex min-w-[110px] flex-col items-center gap-2 text-center"
            aria-label={`نمایش استوری ${story.Title}`}
          >
            <span
              className={`inline-flex h-[96px] w-[96px] items-center justify-center rounded-full p-[3px] ${
                isSeen
                  ? "bg-slate-300"
                  : "bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-orange-400"
              }`}
            >
              <span className="flex h-full w-full items-center justify-center rounded-full bg-white p-[3px]">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={story.Title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-slate-400">Story</span>
                )}
              </span>
            </span>
            <span className="line-clamp-2 max-w-[110px] text-sm leading-5 text-slate-700">
              {story.Title}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function StoriesViewer({
  stories,
  seenIds,
  isOpen,
  initialIndex,
  onClose,
  onStoryView,
}: StoriesViewerProps) {
  const users = useMemo(() => storiesToUsers(stories, seenIds), [stories, seenIds]);
  const lastStoryIdRef = useRef<number | null>(null);

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

  const handleStoryChange = (userIndex: number, _storyIndex: number) => {
    const story = stories[userIndex];
    if (!story) return;

    // Prevent feedback loops from repeated callbacks on the same story.
    if (lastStoryIdRef.current === story.id) return;
    lastStoryIdRef.current = story.id;

    // Don't trigger mark-seen updates if it's already seen.
    if (!seenIds.has(story.id)) {
      onStoryView(story.id);
    }
  };

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
