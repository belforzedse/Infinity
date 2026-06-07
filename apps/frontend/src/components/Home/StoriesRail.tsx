"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StoryRail as SharedStoryRail } from "@repo/story-rail";
import type { Story } from "@/types/story";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useStoriesSeenState } from "@/hooks/useStoriesSeenState";
import { IMAGE_BASE_URL } from "@/constants/api";

const INFINITYGRAM_URL = "https://infinitygram.co";

interface StoriesRailProps {
  stories: Story[];
}

function buildMediaUrl(url: string): string {
  if (url.startsWith("http")) return url;
  const base = (IMAGE_BASE_URL || "").replace(/\/+$/, "");
  const path = url.replace(/^\/+/, "");
  if (!base) return `/${path}`;
  return `${base}/${path}`;
}

export default function StoriesRail({ stories }: StoriesRailProps) {
  const { isAuthenticated } = useCurrentUser();
  const { seenIds, markSeen } = useStoriesSeenState(isAuthenticated);

  const handleStoryView = useCallback((storyId: number) => {
    void markSeen(storyId);
  }, [markSeen]);

  return (
    <div className="flex min-w-0 w-full flex-col gap-3" dir="rtl">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-peyda text-2xl font-bold leading-[21px] text-[#424242] md:text-3xl">
          داستان ها
        </h2>
        <Link
          href={INFINITYGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1 text-sm font-normal text-neutral-600 transition-colors hover:text-infinity-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary focus-visible:ring-offset-2"
        >
          <span>برو به اینفینیتی گرام</span>
          <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
        </Link>
      </div>

      <SharedStoryRail
        stories={stories}
        seenIds={seenIds}
        onMarkSeen={handleStoryView}
        resolveMediaUrl={buildMediaUrl}
        dir="rtl"
        emptyPreviewLabel="ویدیو"
        unavailableText="Story unavailable"
      />
    </div>
  );
}
