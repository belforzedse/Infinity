"use client";

import type { StoryRailPreview, StoryRailStory, StoriesAvatarListProps } from "./types";
import { getStoryRailPreview } from "./story-utils";

const INNER_SIZE_PX = 74;
const OUTER_SIZE_PX = 80;
const STORY_CARD_W_PX = 129;
const STORY_CARD_H_PX = 188;

const STORY_CARD_OVERLAY_CLASS =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(180.32deg,rgba(0,0,0,0.4)_0.28%,rgba(44,44,44,0)_19.42%,rgba(73,73,73,0)_80.88%,rgba(0,0,0,0.4)_99.73%)]";

function joinClasses(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(" ");
}

function StoryRailEmptyPreview({
  isSeen,
  density,
  label,
}: {
  isSeen: boolean;
  density: "card" | "ring";
  label: string;
}) {
  const muted = isSeen ? "grayscale opacity-[0.72]" : "";
  const iconClass = density === "card" ? "h-8 w-8" : "h-5 w-5";
  const textClass =
    density === "card"
      ? "text-xs font-medium text-slate-500"
      : "text-[10px] font-medium text-slate-500";

  return (
    <span
      className={`flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-b from-slate-200 to-slate-100 text-slate-500 ${muted}`}
    >
      <svg viewBox="0 0 24 24" className={iconClass} aria-hidden="true" fill="none">
        <path
          d="M4.75 7.75A2.75 2.75 0 0 1 7.5 5h6A2.75 2.75 0 0 1 16.25 7.75v8.5A2.75 2.75 0 0 1 13.5 19h-6a2.75 2.75 0 0 1-2.75-2.75v-8.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="m16.25 10 3.7-2.1c.58-.33 1.3.09 1.3.75v6.7c0 .66-.72 1.08-1.3.75l-3.7-2.1V10Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`font-peyda ${textClass}`}>{label}</span>
    </span>
  );
}

function StoryAvatarRing({
  isSeen,
  preview,
  title,
  emptyPreviewLabel,
  className,
}: {
  isSeen: boolean;
  preview: StoryRailPreview;
  title: string;
  emptyPreviewLabel: string;
  className?: string;
}) {
  const inner =
    preview.mode === "image" ? (
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
        aria-hidden="true"
        tabIndex={-1}
      />
    ) : (
      <StoryRailEmptyPreview isSeen={isSeen} density="ring" label={emptyPreviewLabel} />
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
        className={joinClasses(
          "box-border flex shrink-0 items-center justify-center rounded-full border-2 border-[#C3C3C3] bg-white transition-transform duration-150 ease-[var(--ease-velvet)] group-active:scale-[0.96]",
          className,
        )}
        style={{ width: OUTER_SIZE_PX, height: OUTER_SIZE_PX }}
      >
        {innerWrap}
      </span>
    );
  }

  return (
    <span
      className={joinClasses(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#3C4D6E] to-[#98BDFF] p-[3px] transition-transform duration-150 ease-[var(--ease-velvet)] group-active:scale-[0.96]",
        className,
      )}
      style={{ width: OUTER_SIZE_PX, height: OUTER_SIZE_PX }}
    >
      {innerWrap}
    </span>
  );
}

function StoryMobileCardInner<TStory extends StoryRailStory>({
  preview,
  story,
  isSeen,
  renderMobileBadge,
  emptyPreviewLabel,
}: {
  preview: StoryRailPreview;
  story: TStory;
  isSeen: boolean;
  renderMobileBadge?: StoriesAvatarListProps<TStory>["renderMobileBadge"];
  emptyPreviewLabel: string;
}) {
  const coverMutedClass = isSeen ? "grayscale opacity-[0.72]" : "";

  return (
    <>
      {preview.mode === "image" ? (
        <img
          src={preview.url}
          alt={story.Title}
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
          aria-hidden="true"
          tabIndex={-1}
        />
      ) : (
        <span className={`absolute inset-0 flex items-center justify-center ${coverMutedClass}`}>
          <StoryRailEmptyPreview isSeen={isSeen} density="card" label={emptyPreviewLabel} />
        </span>
      )}
      <div className={STORY_CARD_OVERLAY_CLASS} aria-hidden="true" />
      {renderMobileBadge ? renderMobileBadge({ story, isSeen }) : null}
    </>
  );
}

export function StoriesAvatarList<TStory extends StoryRailStory = StoryRailStory>({
  stories,
  seenIds,
  onAvatarClick,
  resolveMediaUrl,
  mobileLayout = "card",
  renderMobileBadge,
  emptyPreviewLabel = "Video",
  classNames,
}: StoriesAvatarListProps<TStory>) {
  const useAvatarOnMobile = mobileLayout === "avatar";

  return (
    <div
      className={joinClasses(
        useAvatarOnMobile
          ? "flex h-20 min-h-0 flex-none flex-row items-center gap-4"
          : "flex min-h-[188px] flex-none flex-row items-stretch gap-4 lg:h-20 lg:min-h-0 lg:items-center",
        classNames?.list,
      )}
    >
      {stories.map((story, index) => {
        const preview = getStoryRailPreview(story, resolveMediaUrl);
        const isSeen = seenIds.has(story.id);

        return (
          <button
            key={story.id}
            type="button"
            onClick={() => onAvatarClick(index)}
            className={joinClasses(
              "group pressable flex shrink-0 items-center justify-center rounded-[10px] p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C4D6E] focus-visible:ring-offset-2",
              useAvatarOnMobile ? "size-20 rounded-full" : "lg:size-20 lg:rounded-full",
              classNames?.avatarButton,
            )}
            aria-label={`نمایش استوری ${story.Title}`}
          >
            {useAvatarOnMobile ? (
              <StoryAvatarRing
                isSeen={isSeen}
                preview={preview}
                title={story.Title}
                emptyPreviewLabel={emptyPreviewLabel}
                className={classNames?.desktopRing}
              />
            ) : (
              <>
                <span
                  className={joinClasses(
                    "relative overflow-hidden rounded-[10px] lg:hidden",
                    classNames?.mobileCard,
                  )}
                  style={{ width: STORY_CARD_W_PX, height: STORY_CARD_H_PX }}
                >
                  <StoryMobileCardInner
                    preview={preview}
                    story={story}
                    isSeen={isSeen}
                    renderMobileBadge={renderMobileBadge}
                    emptyPreviewLabel={emptyPreviewLabel}
                  />
                </span>

                <span className="hidden lg:contents">
                  <StoryAvatarRing
                    isSeen={isSeen}
                    preview={preview}
                    title={story.Title}
                    emptyPreviewLabel={emptyPreviewLabel}
                    className={classNames?.desktopRing}
                  />
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
