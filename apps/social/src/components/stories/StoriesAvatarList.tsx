"use client";

import { Video } from "lucide-react";
import type { Story } from "@/types/story";
import { InfinityMarkCircle } from "@/components/InfinityMarkCircle";
import { buildStoryMediaUrl } from "@/lib/story-media-url";

const INNER_SIZE_PX = 74;
const OUTER_SIZE_PX = 80;

const STORY_CARD_W_PX = 129;
const STORY_CARD_H_PX = 188;
/** Same mark/circle ratio as mobile nav: 49px mark in 64px circle → ~15px in 20px circle */
const MOBILE_INFINITY_MARK_PX = 15;

const STORY_CARD_OVERLAY_CLASS =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(180.32deg,rgba(0,0,0,0.4)_0.28%,rgba(44,44,44,0)_19.42%,rgba(73,73,73,0)_80.88%,rgba(0,0,0,0.4)_99.73%)]";

export type StoryRailPreview =
  | { mode: "image"; url: string }
  | { mode: "video"; src: string }
  | { mode: "empty" };

function isImageAsset(story: Story, url?: string): boolean {
  if (!url) return false;
  const mime = story.Media?.mime;
  if (mime) return mime.startsWith("image/");
  return /\.(avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(url);
}

function isVideoAsset(story: Story, url?: string): boolean {
  if (!url) return false;
  const mime = story.Media?.mime;
  if (mime) return mime.startsWith("video/");
  return /\.(m3u8|mov|mp4|m4v|ogg|ogv|webm)(?:[?#].*)?$/i.test(url);
}

/** Thumbnail first; then image media; video without thumbnail uses video URL for `<video>` preview. */
export function getStoryRailPreview(story: Story): StoryRailPreview {
  if (story.Thumbnail?.url) {
    return { mode: "image", url: buildStoryMediaUrl(story.Thumbnail.url) };
  }
  const mediaUrl = story.Media?.url;
  if (!mediaUrl) return { mode: "empty" };
  if (story.MediaType === "video" && isVideoAsset(story, mediaUrl)) {
    return { mode: "video", src: buildStoryMediaUrl(mediaUrl) };
  }
  if (story.MediaType === "image" && isImageAsset(story, mediaUrl)) {
    return { mode: "image", url: buildStoryMediaUrl(mediaUrl) };
  }
  return { mode: "empty" };
}

function StoryRailEmptyPreview({
  isSeen,
  density,
}: {
  isSeen: boolean;
  density: "card" | "ring";
}) {
  const muted = isSeen ? "grayscale opacity-[0.72]" : "";
  const iconClass = density === "card" ? "size-8 text-slate-500" : "size-5 text-slate-500";
  const textClass = density === "card" ? "text-xs font-medium text-slate-500" : "text-[10px] font-medium text-slate-500";
  return (
    <span
      className={`flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-b from-slate-200 to-slate-100 text-slate-500 ${muted}`}
    >
      <Video className={iconClass} aria-hidden />
      <span className={`font-peyda ${textClass}`}>ویدیو</span>
    </span>
  );
}

/** Figma 92985: 80×80 outer, 74×74 media (3px ring). Unseen: gradient border; seen: 2px #C3C3C3 */
function StoryAvatarRing({
  isSeen,
  preview,
  title,
}: {
  isSeen: boolean;
  preview: StoryRailPreview;
  title: string;
}) {
  const inner =
    preview.mode === "image" ? (
      // eslint-disable-next-line @next/next/no-img-element -- CMS Strapi URLs
      <img
        src={preview.url}
        alt={title}
        loading="lazy"
        decoding="async"
        className="h-full w-full rounded-full object-cover"
      />
    ) : preview.mode === "video" ? (
      <video
        src={preview.src}
        muted
        playsInline
        preload="metadata"
        className="h-full w-full rounded-full object-cover"
        aria-hidden
        tabIndex={-1}
      />
    ) : (
      <StoryRailEmptyPreview isSeen={isSeen} density="ring" />
    );

  const innerWrap = (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white"
      style={{ width: INNER_SIZE_PX, height: INNER_SIZE_PX }}
    >
      {inner}
    </span>
  );

  if (isSeen) {
    return (
      <span
        className="box-border flex shrink-0 items-center justify-center rounded-full border-2 border-[#C3C3C3] bg-white transition-transform duration-150 ease-[var(--ease-velvet)] group-active:scale-[0.96]"
        style={{ width: OUTER_SIZE_PX, height: OUTER_SIZE_PX }}
      >
        {innerWrap}
      </span>
    );
  }

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#3C4D6E] to-[#98BDFF] p-[3px] transition-transform duration-150 ease-[var(--ease-velvet)] group-active:scale-[0.96]"
      style={{ width: OUTER_SIZE_PX, height: OUTER_SIZE_PX }}
    >
      {innerWrap}
    </span>
  );
}

function StoryMobileCardInner({
  preview,
  title,
  isSeen,
}: {
  preview: StoryRailPreview;
  title: string;
  isSeen: boolean;
}) {
  const coverMutedClass = isSeen ? "grayscale opacity-[0.72]" : "";

  return (
    <>
      {preview.mode === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element -- CMS Strapi URLs
        <img
          src={preview.url}
          alt={title}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover ${coverMutedClass}`}
        />
      ) : preview.mode === "video" ? (
        <video
          src={preview.src}
          muted
          playsInline
          preload="metadata"
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${coverMutedClass}`}
          aria-hidden
          tabIndex={-1}
        />
      ) : (
        <span className={`absolute inset-0 flex items-center justify-center ${coverMutedClass}`}>
          <StoryRailEmptyPreview isSeen={isSeen} density="card" />
        </span>
      )}
      <div className={STORY_CARD_OVERLAY_CLASS} aria-hidden />
      <div
        dir="ltr"
        className="absolute bottom-[2.13%] right-[4.65%] flex flex-row items-center gap-[3px]"
      >
        <span className="flex w-9 shrink-0 items-center text-right font-peyda text-[10px] font-medium leading-[21px] text-white">
          اینفینیتی
        </span>
        <InfinityMarkCircle circleSize={20} markSize={MOBILE_INFINITY_MARK_PX} />
      </div>
    </>
  );
}

/** Below `lg`: 129×188 preview cards; `lg`+: 80×80 avatars (Figma 92964). */
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
    <div className="flex min-h-[188px] flex-none flex-row items-stretch gap-4 lg:min-h-0 lg:h-20 lg:items-center">
      {stories.map((story, index) => {
        const preview = getStoryRailPreview(story);
        const isSeen = seenIds.has(story.id);

        return (
          <button
            key={story.id}
            type="button"
            onClick={() => onAvatarClick(index)}
            className="group pressable flex shrink-0 items-center justify-center rounded-[10px] p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary focus-visible:ring-offset-2 lg:size-20 lg:rounded-full"
            aria-label={`نمایش استوری ${story.Title}`}
          >
            <span
              className="relative overflow-hidden rounded-[10px] lg:hidden"
              style={{ width: STORY_CARD_W_PX, height: STORY_CARD_H_PX }}
            >
              <StoryMobileCardInner preview={preview} title={story.Title} isSeen={isSeen} />
            </span>

            <span className="hidden lg:contents">
              <StoryAvatarRing isSeen={isSeen} preview={preview} title={story.Title} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
