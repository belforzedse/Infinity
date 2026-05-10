"use client";

import type { Story } from "@/types/story";
import { buildStoryMediaUrl } from "@/lib/story-media-url";

const INNER_SIZE_PX = 74;
const OUTER_SIZE_PX = 80;

/** Figma 92985: 80×80 outer, 74×74 media (3px ring). Unseen: gradient border; seen: 2px #C3C3C3 */
function StoryAvatarRing({
  isSeen,
  avatarUrl,
  title,
}: {
  isSeen: boolean;
  avatarUrl: string;
  title: string;
}) {
  const inner = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- CMS Strapi URLs
    <img
      src={avatarUrl}
      alt={title}
      loading="lazy"
      decoding="async"
      className="h-full w-full rounded-full object-cover"
    />
  ) : (
    <span className="text-xs text-slate-400">Story</span>
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
        className="box-border flex shrink-0 items-center justify-center rounded-full border-2 border-[#C3C3C3] bg-white"
        style={{ width: OUTER_SIZE_PX, height: OUTER_SIZE_PX }}
      >
        {innerWrap}
      </span>
    );
  }

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#3C4D6E] to-[#98BDFF] p-[3px]"
      style={{ width: OUTER_SIZE_PX, height: OUTER_SIZE_PX }}
    >
      {innerWrap}
    </span>
  );
}

/** Frame 92964: row, align center, gap 16px, height 80px — avatars only (no captions in spec). */
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
    <div className="flex h-20 flex-none flex-row items-center gap-4">
      {stories.map((story, index) => {
        const mediaUrl = story.Thumbnail?.url ?? story.Media?.url ?? "";
        const avatarUrl = mediaUrl ? buildStoryMediaUrl(mediaUrl) : "";
        const isSeen = seenIds.has(story.id);

        return (
          <button
            key={story.id}
            type="button"
            onClick={() => onAvatarClick(index)}
            className="flex size-20 shrink-0 items-center justify-center p-0"
            aria-label={`نمایش استوری ${story.Title}`}
          >
            <StoryAvatarRing isSeen={isSeen} avatarUrl={avatarUrl} title={story.Title} />
          </button>
        );
      })}
    </div>
  );
}
