"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HomePostsCollage, gridSpanStyle, OverlayBadge } from "@/components/posts/HomePostsCollage";
import { PostCard } from "@/components/posts/PostCard";
import { POST_CARD_LAYOUTS } from "@/components/posts/post-card-variants";
import { PostDetailView } from "@/components/posts/PostDetailView";
import { useCollageInteractions } from "@/components/posts/use-collage-interactions";
import type { HomeFeedPost } from "@/services/feed-post.service";
import type { PostDetail } from "@/services/post-detail.service";
import { savePostSnapshot } from "@/lib/offline-snapshots";

type PostDetailRelatedLayoutProps = {
  post: PostDetail;
  relatedPosts: readonly HomeFeedPost[];
};

const GRID_COL_GAP = 6;
const GRID_ROW_GAP = 8;

function relatedCardInitialStyle(variant: HomeFeedPost["desktopVariant"]) {
  const layout = POST_CARD_LAYOUTS[variant];
  return {
    ...gridSpanStyle(variant),
    aspectRatio: `${layout.widthPx} / ${layout.imageHeightPx + layout.columnGapPx + 36}`,
  };
}

export function PostDetailRelatedLayout({ post, relatedPosts }: PostDetailRelatedLayoutProps) {
  const postRef = useRef<HTMLDivElement | null>(null);
  const probeRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [postRowSpan, setPostRowSpan] = useState(4);

  const router = useRouter();
  const openPost = useCallback(
    (slug: string) => router.push(`/post/${encodeURIComponent(slug)}`),
    [router],
  );
  const { liked, saved, likeCounts, toggleLiked, toggleSaved, shakeIds } = useCollageInteractions(
    relatedPosts,
    "api",
  );

  useEffect(() => {
    void savePostSnapshot(post).catch(() => undefined);
  }, [post]);

  useEffect(() => {
    function calculateRowSpan() {
      frameRef.current = null;

      const postHeight = postRef.current?.offsetHeight ?? 0;
      const cardHeight = probeRef.current?.offsetHeight ?? 0;

      if (postHeight <= 0 || cardHeight <= 0) return;

      // Derive a single-row (sm) card height from the probe.
      // xl cards span 2 rows so their measured height covers 2 rows + 1 gap.
      const firstVariant = relatedPosts[0]?.desktopVariant;
      const smCardHeight =
        firstVariant === "xl"
          ? Math.max(1, Math.round((cardHeight + GRID_ROW_GAP) / 2 - GRID_ROW_GAP))
          : cardHeight;

      const next = Math.max(2, Math.ceil((postHeight - GRID_ROW_GAP) / (smCardHeight + GRID_ROW_GAP)));
      setPostRowSpan((prev) => (prev === next ? prev : next));
    }

    function schedule() {
      if (frameRef.current != null) return;
      frameRef.current = window.requestAnimationFrame(calculateRowSpan);
    }

    schedule();

    const observer = new ResizeObserver(schedule);
    if (postRef.current) observer.observe(postRef.current);
    if (probeRef.current) observer.observe(probeRef.current);

    return () => {
      observer.disconnect();
      if (frameRef.current != null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [relatedPosts]);

  return (
    <>
      {/* Mobile / tablet: post then full collage stacked */}
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

      {/* Desktop: single 6-col dense grid; post is a pinned cell, cards wrap around it */}
      <div className="hidden w-full min-w-0 lg:block">
        <div
          dir="ltr"
          className="grid w-full min-w-0 *:min-w-0"
          style={{
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            columnGap: GRID_COL_GAP,
            rowGap: GRID_ROW_GAP,
            gridAutoFlow: "dense",
          }}
        >
          <aside
            ref={postRef}
            className="min-w-0"
            dir="rtl"
            style={{ gridColumn: "4 / span 3", gridRow: `1 / span ${postRowSpan}` }}
          >
            <PostDetailView post={post} />
          </aside>

          {relatedPosts.map((relatedPost, index) => (
            <div
              key={relatedPost.id}
              ref={index === 0 ? probeRef : undefined}
              style={relatedCardInitialStyle(relatedPost.desktopVariant)}
              className="flex min-w-0 justify-center"
            >
              <PostCard
                variant={relatedPost.desktopVariant}
                widthMode="fluid"
                imageSrc={relatedPost.imageSrc}
                imageAlt={relatedPost.imageAlt}
                likesCount={likeCounts[relatedPost.id] ?? relatedPost.likesCount}
                commentsCount={relatedPost.commentsCount}
                isLiked={Boolean(liked[relatedPost.id])}
                isSaved={Boolean(saved[relatedPost.id])}
                onLike={() => void toggleLiked(relatedPost.id)}
                onComment={() => openPost(relatedPost.slug)}
                onSave={() => toggleSaved(relatedPost.id)}
                href={`/post/${encodeURIComponent(relatedPost.slug)}`}
                shakeKey={shakeIds[relatedPost.id]}
                overlay={
                  relatedPost.overlay != null ? (
                    <OverlayBadge type={relatedPost.overlay} />
                  ) : undefined
                }
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
