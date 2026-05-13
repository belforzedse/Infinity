"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark } from "lucide-react";
import { useAtomValue } from "jotai";
import toast from "react-hot-toast";
import { HomePostsCollage } from "@/components/posts/HomePostsCollage";
import { HomePostsCollageSkeleton } from "@/components/posts/HomePostsCollageSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSmoothLoading } from "@/hooks/useSmoothLoading";
import { savedPostIdsAtom } from "@/lib/saved-posts-atom";
import { getHomeFeedPosts, type HomeFeedPost } from "@/services/feed-post.service";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

export default function ProfileBookmarksPage() {
  const savedPostIds = useAtomValue(savedPostIdsAtom);
  const [posts, setPosts] = useState<readonly HomeFeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const showLoading = useSmoothLoading(isLoading, { showDelayMs: 80, minVisibleMs: 240 });

  useEffect(() => {
    let cancelled = false;

    getHomeFeedPosts()
      .then((rows) => {
        if (!cancelled) setPosts(rows);
      })
      .catch((error: unknown) => {
        if (!cancelled) toast.error(getUserFacingErrorMessage(error, "دریافت نشان‌ها ناموفق بود."));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const savedSet = useMemo(() => new Set(savedPostIds), [savedPostIds]);
  const bookmarkedPosts = useMemo(
    () => posts.filter((post) => savedSet.has(post.id)),
    [posts, savedSet],
  );

  return (
    <div className="flex w-full flex-col gap-6" dir="rtl">
      <h1 className="font-peyda text-lg font-semibold text-zinc-800 lg:text-xl">
        نشان‌ها
      </h1>

      {isLoading ? (
        showLoading ? <HomePostsCollageSkeleton /> : null
      ) : bookmarkedPosts.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="هنوز پستی ذخیره نکرده‌اید"
          description="پست‌هایی که نشان می‌کنید اینجا جمع می‌شوند."
          cta={{ label: "کاوش پست‌ها", href: "/" }}
        />
      ) : (
        <HomePostsCollage posts={bookmarkedPosts} likeMode="api" showHeading={false} />
      )}
    </div>
  );
}
