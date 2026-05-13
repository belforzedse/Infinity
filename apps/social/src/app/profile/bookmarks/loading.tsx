import { HomePostsCollageSkeleton } from "@/components/posts/HomePostsCollageSkeleton";

export default function ProfileBookmarksLoading() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="skeleton-shimmer h-7 w-20 rounded-lg" aria-hidden />
      <HomePostsCollageSkeleton showHeading={false} />
    </div>
  );
}
