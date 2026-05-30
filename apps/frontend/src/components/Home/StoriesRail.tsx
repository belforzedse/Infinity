"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StoryRail as SharedStoryRail } from "@repo/story-rail";
import InfinityGradientMark from "@/components/Icons/InfinityGradientMark";
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
        <div className="flex items-center gap-1.5">
          <InfinityGradientMark width={32} className="shrink-0" />
          <span className="text-2xl text-foreground-primary md:text-3xl">اینفینیتی گرام</span>
        </div>
        <Link
          href={INFINITYGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1 text-sm font-normal text-neutral-600 transition-colors hover:text-pink-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
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
