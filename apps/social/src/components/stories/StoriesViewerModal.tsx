"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { StoryViewer as LibStoryViewer } from "react-instagram-stories";
import type { StoryItemControls, User } from "react-instagram-stories";
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

const FALLBACK_AVATAR_URL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const VIDEO_LOADING_DURATION_MS = 10 * 60 * 1000;

function isSupportedImageUrl(url: string): boolean {
  return /\.(avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(url);
}

function isSupportedVideoUrl(url: string): boolean {
  return /\.(m3u8|mov|mp4|m4v|ogg|ogv|webm)(?:[?#].*)?$/i.test(url);
}

function hasUsableMediaUrl(url?: string): url is string {
  return typeof url === "string" && url.trim().length > 0;
}

function isImageStory(story: Story): boolean {
  const mediaUrl = story.Media?.url;
  if (story.MediaType !== "image" || !hasUsableMediaUrl(mediaUrl)) return false;
  const mime = story.Media?.mime;
  return mime ? mime.startsWith("image/") : isSupportedImageUrl(mediaUrl);
}

function isVideoStory(story: Story): boolean {
  const mediaUrl = story.Media?.url;
  if (story.MediaType !== "video" || !hasUsableMediaUrl(mediaUrl)) return false;
  const mime = story.Media?.mime;
  return mime ? mime.startsWith("video/") : isSupportedVideoUrl(mediaUrl);
}

function getStaticAvatarUrl(story: Story): string {
  if (story.Thumbnail?.url) return buildStoryMediaUrl(story.Thumbnail.url);
  if (isImageStory(story) && story.Media?.url) return buildStoryMediaUrl(story.Media.url);
  return FALLBACK_AVATAR_URL;
}

function getStoryItemId(story: Story): string {
  const mediaKey = story.Media?.id ?? story.Media?.url ?? "missing-media";
  const timestampKey = story.updatedAt || story.createdAt || "unknown-time";
  return `story-${story.id}-${story.MediaType}-${mediaKey}-${timestampKey}`;
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), length - 1);
}

function cleanupVideo(video: HTMLVideoElement | null): void {
  if (!video) return;
  video.pause();
  try {
    video.currentTime = 0;
  } catch {
    // Some browsers reject currentTime changes before metadata is available.
  }
}

function createVideoStoryComponent({
  src,
  poster,
}: {
  src: string;
  poster?: string;
}): React.FC<StoryItemControls> {
  const VideoStory: React.FC<StoryItemControls> = (controls) => {
    const [isLoading, setIsLoading] = useState(true);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const controlsRef = useRef(controls);
    const loadStartedAtRef = useRef<number>(0);
    const hasAdvancedRef = useRef(false);

    useLayoutEffect(() => {
      controlsRef.current = controls;
    }, [controls]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      let isMounted = true;
      const playVideo = () => {
        if (!isMounted) return;
        const playPromise = video.play();
        if (typeof playPromise?.catch === "function") {
          playPromise.catch(() => undefined);
        }
      };

      const handleLoadedMetadata = () => {
        if (Number.isFinite(video.duration) && video.duration > 0) {
          const loadingElapsed = Date.now() - loadStartedAtRef.current;
          controlsRef.current.setDuration(loadingElapsed + video.duration * 1000);
        }
      };
      const handlePlayable = () => {
        setIsLoading(false);
        playVideo();
      };
      const handleEnded = () => {
        if (hasAdvancedRef.current) return;
        hasAdvancedRef.current = true;
        controlsRef.current.next();
      };
      const handleError = () => {
        if (hasAdvancedRef.current) return;
        hasAdvancedRef.current = true;
        setIsLoading(false);
        controlsRef.current.next();
      };

      loadStartedAtRef.current = Date.now();
      hasAdvancedRef.current = false;
      controlsRef.current.setDuration(VIDEO_LOADING_DURATION_MS);
      cleanupVideo(video);
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("loadeddata", handlePlayable);
      video.addEventListener("canplay", handlePlayable);
      video.addEventListener("canplaythrough", handlePlayable);
      video.addEventListener("playing", handlePlayable);
      video.addEventListener("ended", handleEnded);
      video.addEventListener("error", handleError);
      video.load();

      const playTimer = window.setTimeout(playVideo, 0);
      const stateTimer = window.setInterval(() => {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          setIsLoading(false);
        }

        if (
          !hasAdvancedRef.current &&
          Number.isFinite(video.duration) &&
          video.duration > 0 &&
          video.currentTime >= video.duration - 0.1
        ) {
          hasAdvancedRef.current = true;
          controlsRef.current.next();
        }
      }, 500);

      return () => {
        isMounted = false;
        window.clearTimeout(playTimer);
        window.clearInterval(stateTimer);
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("loadeddata", handlePlayable);
        video.removeEventListener("canplay", handlePlayable);
        video.removeEventListener("canplaythrough", handlePlayable);
        video.removeEventListener("playing", handlePlayable);
        video.removeEventListener("ended", handleEnded);
        video.removeEventListener("error", handleError);
        cleanupVideo(video);
      };
    }, []);

    return (
      <div className="relative flex h-full w-full items-center justify-center bg-black">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="h-full w-full object-contain"
          muted
          playsInline
          autoPlay
          preload="auto"
          controls={false}
        />
        {isLoading ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/35 border-t-white" />
          </div>
        ) : null}
      </div>
    );
  };

  VideoStory.displayName = "StoryVideo";
  return VideoStory;
}

function storiesToUsers(stories: Story[]): User[] {
  return stories.map((story) => {
    const mediaUrl = hasUsableMediaUrl(story.Media?.url)
      ? buildStoryMediaUrl(story.Media.url)
      : "";
    const storyItemId = getStoryItemId(story);
    const poster = story.Thumbnail?.url ? buildStoryMediaUrl(story.Thumbnail.url) : undefined;

    return {
      id: String(story.id),
      username: story.Title,
      avatarUrl: getStaticAvatarUrl(story),
      hasUnreadStories: false,
      stories: [
        isVideoStory(story)
          ? {
              id: storyItemId,
              type: "custom_component" as const,
              component: createVideoStoryComponent({ src: mediaUrl, poster }),
              duration: VIDEO_LOADING_DURATION_MS,
            }
          : isImageStory(story)
            ? {
                id: storyItemId,
                type: "image" as const,
                src: mediaUrl,
                alt: story.Title,
                duration: story.DurationMs,
              }
            : {
                id: storyItemId,
                type: "text" as const,
                text: story.Title || "Story unavailable",
                backgroundColor: "#111827",
                textColor: "#ffffff",
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
  const users = useMemo(() => storiesToUsers(stories), [stories]);
  const safeInitialIndex = useMemo(
    () => clampIndex(initialIndex, users.length),
    [initialIndex, users.length],
  );
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
   * in its dependency array and calls it whenever the reference changes. Inline handlers loop updates.
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
      key={`${users[safeInitialIndex]?.id ?? "empty"}-${safeInitialIndex}`}
      users={users}
      isOpen={isOpen}
      initialUserIndex={safeInitialIndex}
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
