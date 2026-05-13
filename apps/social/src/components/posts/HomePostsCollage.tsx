"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers2, Video } from "lucide-react";
import toast from "react-hot-toast";
import { InfinityMarkCircle } from "@/components/InfinityMarkCircle";
import { PostCard, toMobilePostCardVariant } from "@/components/posts/PostCard";
import type { DesktopPostCardVariant } from "@/components/posts/post-card-variants";
import type { HomeFeedCardOverlay, HomeFeedPost } from "@/services/feed-post.service";
import { useIsLgUp } from "@/components/posts/use-is-lg-up";
import { getLikedPostIds, hasAccessToken, togglePostLike } from "@/services/post-like.service";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

/** Tight horizontal gap; cards use `widthMode="fluid"` so tracks shrink without horizontal scroll. */
const GRID_GAP_X_PX = 6;

function OverlayBadge({ type }: { type: Exclude<HomeFeedCardOverlay, null> }) {
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

function gridSpanStyle(variant: DesktopPostCardVariant): CSSProperties {
  return variant === "xl"
    ? { gridColumn: "span 2", gridRow: "span 2" }
    : { gridColumn: "span 1", gridRow: "span 1" };
}

export type HomePostsCollageProps = {
  posts: readonly HomeFeedPost[];
  desktopLayout?: "fluid" | "compact";
  likeMode?: "local" | "api";
  showHeading?: boolean;
};

/**
 * Homepage «پست ها»: **`lg`+** — 6-column dense grid. Below **`lg`**: dense tablet tracks
 * let later small cards backfill around large cards instead of leaving open rows.
 */
export function HomePostsCollage({
  posts,
  desktopLayout = "fluid",
  likeMode = "local",
  showHeading = true,
}: HomePostsCollageProps) {
  const isLgUp = useIsLgUp();
  const router = useRouter();
  const [liked, setLiked] = useState<Readonly<Record<string, boolean>>>({});
  const [saved, setSaved] = useState<Readonly<Record<string, boolean>>>({});
  const [likeCounts, setLikeCounts] = useState<Readonly<Record<string, number>>>({});
  const [pendingLikes, setPendingLikes] = useState<Readonly<Record<string, boolean>>>({});

  const openPost = useCallback((slug: string) => router.push(`/post/${encodeURIComponent(slug)}`), [router]);

  useEffect(() => {
    if (likeMode !== "api" || !hasAccessToken()) return;

    let cancelled = false;
    getLikedPostIds()
      .then((ids) => {
        if (cancelled) return;
        const next: Record<string, boolean> = {};
        posts.forEach((post) => {
          if (ids.has(post.id)) next[post.id] = true;
        });
        setLiked(next);
      })
      .catch(() => {
        if (!cancelled) setLiked({});
      });

    return () => {
      cancelled = true;
    };
  }, [likeMode, posts]);

  const toggleLiked = useCallback(
    async (id: string) => {
      if (likeMode === "local") {
        setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
        return;
      }

      if (!hasAccessToken()) {
        toast.error("برای پسندیدن پست ابتدا وارد حساب کاربری شوید.");
        return;
      }

      if (pendingLikes[id]) return;

      const wasLiked = Boolean(liked[id]);
      const nextLiked = !wasLiked;
      setPendingLikes((prev) => ({ ...prev, [id]: true }));
      setLiked((prev) => ({ ...prev, [id]: nextLiked }));
      setLikeCounts((prev) => ({
        ...prev,
        [id]: (prev[id] ?? posts.find((post) => post.id === id)?.likesCount ?? 0) + (nextLiked ? 1 : -1),
      }));

      try {
        const result = await togglePostLike(id);
        setLiked((prev) => ({ ...prev, [id]: result.isLiked }));
        if (result.isLiked !== nextLiked) {
          setLikeCounts((prev) => ({
            ...prev,
            [id]: Math.max(
              0,
              (prev[id] ?? posts.find((post) => post.id === id)?.likesCount ?? 0) +
                (result.isLiked ? 1 : -1),
            ),
          }));
        }
      } catch (error: unknown) {
        setLiked((prev) => ({ ...prev, [id]: wasLiked }));
        setLikeCounts((prev) => ({
          ...prev,
          [id]: posts.find((post) => post.id === id)?.likesCount ?? prev[id] ?? 0,
        }));
        toast.error(getUserFacingErrorMessage(error, "پسندیدن پست ناموفق بود."));
      } finally {
        setPendingLikes((prev) => ({ ...prev, [id]: false }));
      }
    },
    [likeMode, liked, pendingLikes, posts],
  );

  const toggleSaved = useCallback((id: string) => {
    setSaved((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const desktopItems = useMemo(
    () =>
      posts.map((post) => {
        const variant = desktopLayout === "compact" ? "sm" : post.desktopVariant;
        return {
          post,
          variant,
          cellStyle: gridSpanStyle(variant),
        };
      }),
    [desktopLayout, posts],
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
        <p className="w-full text-right font-peyda text-sm text-zinc-500" role="status">
          هنوز پستی ثبت نشده است.
        </p>
      ) : isLgUp && desktopLayout === "compact" ? (
        <div className="w-full min-w-0" dir="ltr">
          <div className="grid w-full grid-flow-dense grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-2 gap-y-2">
            {desktopItems.map(({ post, variant }) => (
              <div
                key={post.id}
                className="flex min-w-0 justify-center"
              >
                <PostCard
                  variant={variant}
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
                  onSave={() => toggleSaved(post.id)}
                  href={`/post/${encodeURIComponent(post.slug)}`}
                  overlay={post.overlay != null ? <OverlayBadge type={post.overlay} /> : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      ) : isLgUp ? (
        <div className="w-full min-w-0" dir="ltr">
          <div
            className="mx-auto grid w-full max-w-full justify-items-stretch px-0 [&>div]:min-w-0"
            style={gridStyle}
          >
            {desktopItems.map(({ post, variant, cellStyle }) => (
              <div key={post.id} style={cellStyle} className="flex min-w-0 justify-center">
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
                  onSave={() => toggleSaved(post.id)}
                  href={`/post/${encodeURIComponent(post.slug)}`}
                  overlay={post.overlay != null ? <OverlayBadge type={post.overlay} /> : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid w-full min-w-0 grid-flow-dense grid-cols-2 gap-x-2 gap-y-2 auto-rows-auto sm:grid-cols-3 md:grid-cols-4 md:gap-x-2 md:gap-y-2 min-[900px]:grid-cols-5">
          {mobileCards.map((post) =>
            post.variant === "mobile-lg" ? (
              <div key={post.id} className="col-span-2 flex min-w-0 justify-center sm:row-span-2">
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
                    onSave={() => toggleSaved(post.id)}
                    href={`/post/${encodeURIComponent(post.slug)}`}
                    overlay={post.overlay != null ? <OverlayBadge type={post.overlay} /> : undefined}
                  />
                </div>
              </div>
            ) : (
              <div key={post.id} className="min-w-0 w-full">
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
                  onSave={() => toggleSaved(post.id)}
                  href={`/post/${encodeURIComponent(post.slug)}`}
                  overlay={post.overlay != null ? <OverlayBadge type={post.overlay} /> : undefined}
                />
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}
