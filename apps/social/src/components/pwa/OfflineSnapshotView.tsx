"use client";

import { useEffect, useMemo, useState } from "react";
import { Images, WifiOff } from "lucide-react";
import { HomePostsCollage } from "@/components/posts/HomePostsCollage";
import { BlurImage } from "@/components/ui/BlurImage";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getHomeFeedSnapshot,
  getPostSnapshot,
  type HomeFeedSnapshot,
  type PostSnapshot,
} from "@/lib/offline-snapshots";

function formatCachedAt(value: number) {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function CachedBadge({ updatedAt }: { updatedAt: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-peyda text-xs text-[#7B8498] shadow-sm">
      <WifiOff className="size-3.5" aria-hidden />
      <span>نسخه ذخیره‌شده از {formatCachedAt(updatedAt)}</span>
    </div>
  );
}

function OfflinePostSnapshot({ snapshot }: { snapshot: PostSnapshot }) {
  const firstMedia = snapshot.post.media[0];

  return (
    <section className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
      <CachedBadge updatedAt={snapshot.updatedAt} />
      <article className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_45px_rgba(61,76,110,0.08)]">
        {firstMedia ? (
          <div className="relative aspect-[4/5] w-full bg-zinc-100">
            <BlurImage
              src={firstMedia.url}
              alt={firstMedia.alternativeText}
              fill
              sizes="(max-width: 768px) 100vw, 720px"
              className="object-cover"
            />
          </div>
        ) : null}
        <div className="space-y-3 p-5 text-right">
          <h1 className="font-peyda text-xl font-bold text-[#424242]">{snapshot.post.title}</h1>
          {snapshot.post.caption ? (
            <p className="font-peyda text-sm leading-7 text-[#3D4C6E]">{snapshot.post.caption}</p>
          ) : null}
          <div className="font-peyda text-sm text-[#7B8498]">
            {snapshot.post.commentsCount} دیدگاه · {snapshot.post.likesCount} پسند
          </div>
        </div>
      </article>
    </section>
  );
}

export function OfflineSnapshotView() {
  const [homeSnapshot, setHomeSnapshot] = useState<HomeFeedSnapshot | null>(null);
  const [postSnapshot, setPostSnapshot] = useState<PostSnapshot | null>(null);
  const [isReady, setIsReady] = useState(false);

  const pathname = useMemo(
    () => (typeof window === "undefined" ? "/offline" : window.location.pathname),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (pathname.startsWith("/post/")) {
        const slug = decodeURIComponent(pathname.slice("/post/".length));
        const snapshot = await getPostSnapshot(slug);
        if (!cancelled) setPostSnapshot(snapshot);
      } else {
        const snapshot = await getHomeFeedSnapshot();
        if (!cancelled) setHomeSnapshot(snapshot);
      }
      if (!cancelled) setIsReady(true);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!isReady) return null;

  if (postSnapshot) {
    return <OfflinePostSnapshot snapshot={postSnapshot} />;
  }

  if (homeSnapshot) {
    return (
      <section className="flex w-full flex-col gap-4">
        <CachedBadge updatedAt={homeSnapshot.updatedAt} />
        <HomePostsCollage posts={homeSnapshot.posts} likeMode="local" persistSnapshot={false} />
      </section>
    );
  }

  return (
    <EmptyState
      icon={Images}
      title="نسخه آفلاین در دسترس نیست"
      description="برای دیدن محتوای ذخیره‌شده، ابتدا یک‌بار در حالت آنلاین این صفحه را باز کنید."
      className="min-h-[50dvh]"
    />
  );
}
