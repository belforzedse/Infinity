"use client";

import { useCallback, useMemo, useState } from "react";
import type { StoryRailProps, StoryRailStory } from "./types";
import { StoriesAvatarList } from "./StoriesAvatarList";
import { StoriesViewerModal } from "./StoriesViewerModal";
import { sortStoriesNewestFirst } from "./story-utils";

function joinClasses(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(" ");
}

export function StoryRail<TStory extends StoryRailStory = StoryRailStory>({
  stories,
  seenIds,
  onMarkSeen,
  resolveMediaUrl,
  heading,
  headingId = "stories-rail-heading",
  dir = "rtl",
  className,
  classNames,
  viewerClassNames,
  renderMobileBadge,
  emptyPreviewLabel = "Video",
  unavailableText = "Story unavailable",
}: StoryRailProps<TStory>) {
  const orderedStories = useMemo(() => sortStoriesNewestFirst(stories), [stories]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleClose = useCallback(() => setViewerOpen(false), []);

  const handleStoryView = useCallback(
    (storyId: number) => {
      void onMarkSeen(storyId);
    },
    [onMarkSeen],
  );

  const handleAvatarClick = useCallback(
    (index: number) => {
      setActiveIndex(index);
      setViewerOpen(true);
      const story = orderedStories[index];
      if (story) void onMarkSeen(story.id);
    },
    [orderedStories, onMarkSeen],
  );

  if (!orderedStories.length) return null;

  return (
    <>
      <section
        className={joinClasses("flex w-full flex-col items-end gap-5 p-0", className, classNames?.root)}
        dir={dir}
        aria-labelledby={heading ? headingId : undefined}
      >
        {heading ? (
          <h2
            id={headingId}
            className={joinClasses(
              "self-stretch text-right font-peyda text-2xl font-bold leading-[21px] text-[#424242]",
              classNames?.heading,
            )}
          >
            {heading}
          </h2>
        ) : null}

        <div
          className={joinClasses(
            "stories-rail min-h-[188px] w-full min-w-0 overflow-x-auto scrollbar-hide lg:h-20 lg:min-h-0",
            classNames?.scroller,
          )}
          dir={dir}
        >
          <div
            className={joinClasses(
              "flex min-h-[188px] w-max min-w-full flex-row items-stretch justify-start gap-4 lg:h-20 lg:min-h-0 lg:items-center",
              classNames?.scrollerInner,
            )}
          >
            <StoriesAvatarList
              stories={orderedStories}
              seenIds={seenIds}
              onAvatarClick={handleAvatarClick}
              resolveMediaUrl={resolveMediaUrl}
              renderMobileBadge={renderMobileBadge}
              emptyPreviewLabel={emptyPreviewLabel}
              classNames={classNames}
            />
          </div>
        </div>
      </section>

      {viewerOpen ? (
        <StoriesViewerModal
          stories={orderedStories}
          seenIds={seenIds}
          isOpen={viewerOpen}
          initialIndex={activeIndex}
          onClose={handleClose}
          onStoryView={handleStoryView}
          resolveMediaUrl={resolveMediaUrl}
          unavailableText={unavailableText}
          classNames={viewerClassNames}
        />
      ) : null}
    </>
  );
}
