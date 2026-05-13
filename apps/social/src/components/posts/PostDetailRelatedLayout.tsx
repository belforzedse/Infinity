"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HomePostsCollage } from "@/components/posts/HomePostsCollage";
import { PostDetailView } from "@/components/posts/PostDetailView";
import type { HomeFeedPost } from "@/services/feed-post.service";
import type { PostDetail } from "@/services/post-detail.service";

type PostDetailRelatedLayoutProps = {
  post: PostDetail;
  relatedPosts: readonly HomeFeedPost[];
};

const DEFAULT_SIDE_CAPACITY = 6;
const COMPACT_CARD_MIN_WIDTH = 168;
const COMPACT_GRID_GAP = 8;

export function PostDetailRelatedLayout({ post, relatedPosts }: PostDetailRelatedLayoutProps) {
  const postRef = useRef<HTMLDivElement | null>(null);
  const sideRef = useRef<HTMLDivElement | null>(null);
  const probeRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [sideCapacity, setSideCapacity] = useState(DEFAULT_SIDE_CAPACITY);

  useEffect(() => {
    function calculateCapacity() {
      frameRef.current = null;

      const postHeight = postRef.current?.offsetHeight ?? 0;
      const sideWidth = sideRef.current?.clientWidth ?? 0;
      const cardHeight = probeRef.current?.offsetHeight ?? 0;

      if (postHeight <= 0 || sideWidth <= 0 || cardHeight <= 0) return;

      const columns = Math.max(
        1,
        Math.floor((sideWidth + COMPACT_GRID_GAP) / (COMPACT_CARD_MIN_WIDTH + COMPACT_GRID_GAP)),
      );
      const rows = Math.max(
        1,
        Math.floor((postHeight + COMPACT_GRID_GAP) / (cardHeight + COMPACT_GRID_GAP)),
      );
      const nextCapacity = Math.max(1, columns * rows);

      setSideCapacity((current) => (current === nextCapacity ? current : nextCapacity));
    }

    function scheduleCalculation() {
      if (frameRef.current != null) return;
      frameRef.current = window.requestAnimationFrame(calculateCapacity);
    }

    scheduleCalculation();

    const observer = new ResizeObserver(scheduleCalculation);
    if (postRef.current) observer.observe(postRef.current);
    if (sideRef.current) observer.observe(sideRef.current);
    if (probeRef.current) observer.observe(probeRef.current);

    return () => {
      observer.disconnect();
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const { sidePosts, lowerPosts } = useMemo(
    () => ({
      sidePosts: relatedPosts.slice(0, sideCapacity),
      lowerPosts: relatedPosts.slice(sideCapacity),
    }),
    [relatedPosts, sideCapacity],
  );

  return (
    <>
      <div className="flex w-full min-w-0 flex-col gap-6 lg:hidden">
        <aside className="w-full min-w-0">
          <PostDetailView post={post} />
        </aside>

        {relatedPosts.length > 0 ? (
          <section aria-label="پست‌های دیگر">
            <HomePostsCollage posts={relatedPosts} likeMode="api" />
          </section>
        ) : null}
      </div>

      <div className="hidden w-full min-w-0 flex-col gap-6 lg:flex">
        <div
          className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(580px,660px)] items-start gap-6"
          dir="ltr"
        >
          <section className="min-w-0" aria-label="پست‌های دیگر">
            <div ref={sideRef} className="relative min-w-0">
              <HomePostsCollage
                posts={sidePosts}
                desktopLayout="compact"
                likeMode="api"
                compactProbeRef={probeRef}
              />
            </div>
          </section>
          <aside ref={postRef} className="min-w-0">
            <PostDetailView post={post} />
          </aside>
        </div>

        {lowerPosts.length > 0 ? (
          <section aria-label="پست‌های بیشتر">
            <HomePostsCollage posts={lowerPosts} likeMode="api" showHeading={false} />
          </section>
        ) : null}
      </div>
    </>
  );
}
