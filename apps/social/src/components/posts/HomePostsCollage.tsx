"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Images, Layers2, Video } from "lucide-react";
import { InfinityMarkCircle } from "@/components/InfinityMarkCircle";
import { PostCard, toMobilePostCardVariant } from "@/components/posts/PostCard";
import type { DesktopPostCardVariant } from "@/components/posts/post-card-variants";
import type { HomeFeedCardOverlay, HomeFeedPost } from "@/services/feed-post.service";
import { useIsLgUp } from "@/components/posts/use-is-lg-up";
import { useCollageInteractions } from "@/components/posts/use-collage-interactions";
import { EmptyState } from "@/components/ui/EmptyState";
import { saveHomeFeedSnapshot } from "@/lib/offline-snapshots";

/** Tight horizontal gap; cards use `widthMode="fluid"` so tracks shrink without horizontal scroll. */
const GRID_GAP_X_PX = 6;

export function OverlayBadge({ type }: { type: Exclude<HomeFeedCardOverlay, null> }) {
  const shell =
    "inline-flex items-center justify-center rounded-lg bg-black/[0.14] p-0.5 shadow-sm backdrop-blur-[7px]";

  if (type === "infinity") {
    return (
      <div className={shell} aria-hidden>
        <InfinityMarkCircle circleSize={20} markSize={15} />
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className={shell} aria-hidden>
        <span className="flex size-6 items-center justify-center text-white">
          <Video className="size-[13px] stroke-white text-white" strokeWidth={1.5} />
        </span>
      </div>
    );
  }

  return (
    <div className={shell} aria-hidden>
      <span className="flex size-6 items-center justify-center text-white">
        <Layers2 className="size-[13px] stroke-white text-white" strokeWidth={1.5} />
      </span>
    </div>
  );
}

export function gridSpanStyle(variant: DesktopPostCardVariant): CSSProperties {
  return variant === "xl"
    ? { gridColumn: "span 2", gridRow: "span 2" }
    : { gridColumn: "span 1", gridRow: "span 1" };
}

function staggerStyle(index: number): CSSProperties {
  return { "--i": Math.min(index, 12) } as CSSProperties;
}

export type HomePostsCollageProps = {
  posts: readonly HomeFeedPost[];
  likeMode?: "local" | "api";
  showHeading?: boolean;
  onSavedChange?: (postId: string, isSaved: boolean) => void;
  persistSnapshot?: boolean;
};

/**
 * Homepage «پست ها»: **`lg`+** — 6-column dense grid. Below **`lg`**: dense tablet tracks
 * let later small cards backfill around large cards instead of leaving open rows.
 */
export function HomePostsCollage({
  posts,
  likeMode = "local",
  showHeading = true,
  onSavedChange,
  persistSnapshot = true,
}: HomePostsCollageProps) {
  const isLgUp = useIsLgUp();
  const router = useRouter();
  const { liked, saved, likeCounts, toggleLiked, toggleSaved, shakeIds } = useCollageInteractions(
    posts,
    likeMode,
    onSavedChange,
  );
  const openPost = useCallback((slug: string) => router.push(`/post/${encodeURIComponent(slug)}`), [router]);

  const desktopItems = useMemo(
    () =>
      posts.map((post) => ({
        post,
        variant: post.desktopVariant,
        cellStyle: gridSpanStyle(post.desktopVariant),
      })),
    [posts],
  );

  const mobileCards = useMemo(
    () =>
      posts.map((post) => {
        const variant = toMobilePostCardVariant(post.desktopVariant);
        return {
          ...post,
          variant,
        };
      }),
    [posts],
  );

  const gridStyle = {
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    columnGap: GRID_GAP_X_PX,
    rowGap: 8,
    gridAutoFlow: "dense" as const,
  };

  const hasPosts = posts.length > 0;

  useEffect(() => {
    if (!persistSnapshot || posts.length === 0 || !window.navigator.onLine) return;
    void saveHomeFeedSnapshot(posts).catch(() => undefined);
  }, [persistSnapshot, posts]);

  return (
    <section
      className="flex w-full min-w-0 flex-col items-stretch gap-3 p-0 lg:gap-4"
      dir="rtl"
      aria-labelledby={showHeading ? "home-posts-heading" : undefined}
    >
      {showHeading ? (
        <h2
          id="home-posts-heading"
          className="self-stretch text-right font-peyda text-2xl font-bold leading-[21px] text-[#424242]"
        >
          پست ها
        </h2>
      ) : null}

      {!hasPosts ? (
        <EmptyState
          icon={Images}
          title="هنوز پستی ثبت نشده است"
          description="وقتی پستی منتشر شود، اینجا نمایش داده می‌شود."
          className="w-full"
        />
      ) : isLgUp ? (
        <div className="w-full min-w-0" dir="ltr">
          <div
            className="mx-auto grid w-full max-w-full justify-items-stretch px-0 [&>div]:min-w-0"
            style={gridStyle}
          >
            {desktopItems.map(({ post, variant, cellStyle }, index) => (
              <div
                key={post.id}
                style={{ ...cellStyle, ...staggerStyle(index) }}
                className="animate-stagger-fade-up flex min-w-0 justify-center"
              >
                <PostCard
                  variant={variant}
                  widthMode="fluid"
                  imageSrc={post.imageSrc}
                  imageAlt={post.imageAlt}
                  likesCount={likeCounts[post.id] ?? post.likesCount}
                  commentsCount={post.commentsCount}
                  isLiked={Boolean(liked[post.id])}
                  isSaved={Boolean(saved[post.id])}
                  onLike={() => void toggleLiked(post.id)}
                  onComment={() => openPost(post.slug)}
                  onSave={() => void toggleSaved(post.id)}
                  href={`/post/${encodeURIComponent(post.slug)}`}
                  overlay={post.overlay != null ? <OverlayBadge type={post.overlay} /> : undefined}
                  shakeKey={shakeIds[post.id]}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid w-full min-w-0 grid-flow-dense grid-cols-2 gap-x-2 gap-y-2 auto-rows-auto sm:grid-cols-3 md:grid-cols-4 md:gap-x-2 md:gap-y-2 min-[900px]:grid-cols-5">
          {mobileCards.map((post, index) =>
            post.variant === "mobile-lg" ? (
              <div
                key={post.id}
                style={staggerStyle(index)}
                className="animate-stagger-fade-up col-span-2 flex min-w-0 justify-center sm:row-span-2"
              >
                <div className="w-full min-w-0">
                  <PostCard
                    variant={post.variant}
                    widthMode="fluid"
                    fluidMaxWidth="none"
                    className="w-full"
                    imageSrc={post.imageSrc}
                    imageAlt={post.imageAlt}
                    likesCount={likeCounts[post.id] ?? post.likesCount}
                    commentsCount={post.commentsCount}
                    isLiked={Boolean(liked[post.id])}
                    isSaved={Boolean(saved[post.id])}
                    onLike={() => void toggleLiked(post.id)}
                    onComment={() => openPost(post.slug)}
                    onSave={() => void toggleSaved(post.id)}
                    href={`/post/${encodeURIComponent(post.slug)}`}
                    overlay={post.overlay != null ? <OverlayBadge type={post.overlay} /> : undefined}
                    shakeKey={shakeIds[post.id]}
                  />
                </div>
              </div>
            ) : (
              <div
                key={post.id}
                style={staggerStyle(index)}
                className="animate-stagger-fade-up min-w-0 w-full"
              >
                <PostCard
                  variant={post.variant}
                  widthMode="fluid"
                  fluidMaxWidth="none"
                  className="w-full"
                  imageSrc={post.imageSrc}
                  imageAlt={post.imageAlt}
                  likesCount={likeCounts[post.id] ?? post.likesCount}
                  commentsCount={post.commentsCount}
                  isLiked={Boolean(liked[post.id])}
                  isSaved={Boolean(saved[post.id])}
                  onLike={() => void toggleLiked(post.id)}
                  onComment={() => openPost(post.slug)}
                  onSave={() => void toggleSaved(post.id)}
                  href={`/post/${encodeURIComponent(post.slug)}`}
                  overlay={post.overlay != null ? <OverlayBadge type={post.overlay} /> : undefined}
                  shakeKey={shakeIds[post.id]}
                />
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}
