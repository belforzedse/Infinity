"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import toast from "react-hot-toast";
import { HomePostsCollage } from "@/components/posts/HomePostsCollage";
import { HomePostsCollageSkeleton } from "@/components/posts/HomePostsCollageSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSmoothLoading } from "@/hooks/useSmoothLoading";
import type { HomeFeedPost } from "@/services/feed-post.service";
import { getUserBookmarkedPosts } from "@/services/post-bookmark.service";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

export default function ProfileBookmarksPage() {
  const [posts, setPosts] = useState<readonly HomeFeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const showLoading = useSmoothLoading(isLoading, { showDelayMs: 80, minVisibleMs: 240 });

  useEffect(() => {
    let cancelled = false;

    getUserBookmarkedPosts(1, 100)
      .then((response) => {
        if (!cancelled) setPosts(response.data);
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

  const handleSavedChange = useCallback((postId: string, isSaved: boolean) => {
    if (isSaved) return;
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  }, []);

  return (
    <div className="flex w-full flex-col gap-6" dir="rtl">
      <h1 className="font-peyda text-lg font-semibold text-zinc-800 lg:text-xl">
        نشان‌ها
      </h1>

      {isLoading ? (
        showLoading ? <HomePostsCollageSkeleton /> : null
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="هنوز پستی ذخیره نکرده‌اید"
          description="پست‌هایی که نشان می‌کنید اینجا جمع می‌شوند."
          cta={{ label: "کاوش پست‌ها", href: "/" }}
        />
      ) : (
        <HomePostsCollage
          posts={posts}
          likeMode="api"
          showHeading={false}
          onSavedChange={handleSavedChange}
        />
      )}
    </div>
  );
}
