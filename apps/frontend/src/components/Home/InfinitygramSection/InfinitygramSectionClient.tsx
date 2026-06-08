"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  SocialPostCard,
  SocialPostOverlayBadge,
  toMobilePostCardVariant,
} from "@repo/social-posts/client";
import type { SocialFeedPost } from "@repo/social-posts";

type InfinitygramSectionClientProps = {
  posts: readonly SocialFeedPost[];
};

const DESKTOP_CELLS = [
  "col-start-1 col-span-2 row-start-1",
  "col-start-1 col-span-2 row-start-2",
  "col-start-3 col-span-3 row-start-1 row-span-2",
  "col-start-6 col-span-2 row-start-1",
  "col-start-6 col-span-2 row-start-2",
  "col-start-8 col-span-2 row-start-1",
  "col-start-8 col-span-2 row-start-2",
  "col-start-10 col-span-3 row-start-1 row-span-2",
] as const;

function hrefForPost(slug: string) {
  return `/social/post/${encodeURIComponent(slug)}`;
}

function PostCard({
  post,
  forceVariant,
  className,
}: {
  post: SocialFeedPost;
  forceVariant?: "xl" | "sm" | "mobile-lg" | "mobile-sm";
  className?: string;
}) {
  const variant = forceVariant ?? post.desktopVariant;
  return (
    <SocialPostCard
      variant={variant}
      widthMode="fluid"
      fluidMaxWidth="none"
      className={className}
      imageSrc={post.imageSrc}
      imageAlt={post.imageAlt}
      previewMedia={post.previewMedia}
      likesCount={post.likesCount}
      commentsCount={post.commentsCount}
      href={hrefForPost(post.slug)}
      linkAriaLabel={`مشاهده پست ${post.title || post.imageAlt}`}
      overlay={post.overlay != null ? <SocialPostOverlayBadge type={post.overlay} /> : undefined}
    />
  );
}

export default function InfinitygramSectionClient({ posts }: InfinitygramSectionClientProps) {
  const visiblePosts = posts.slice(0, 8);

  return (
    <section
      dir="rtl"
      aria-labelledby="home-infinitygram-heading"
      className="overflow-hidden rounded-none bg-[#252220] px-3 py-8 text-white sm:rounded-lg sm:px-6 lg:px-8 lg:py-10"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2
          id="home-infinitygram-heading"
          className="flex items-center gap-2 text-right font-peyda text-2xl font-bold leading-9 text-white md:text-3xl"
        >
          <span>از اینفینیتی‌گرام خرید کن</span>
          <span className="inline-flex size-6 items-center justify-center rounded-md bg-[#D52953] text-white shadow-sm">
            <img src="/Infinity.svg" alt="" width={18} height={18} className="block" />
          </span>
        </h2>

        <Link
          href="/social"
          className="pressable hidden shrink-0 items-center gap-2 text-sm font-medium text-white/90 transition-colors hover:text-white sm:inline-flex"
        >
          <span>برو به اینفینیتی‌گرام</span>
          <ArrowLeft className="size-4" strokeWidth={1.7} aria-hidden />
        </Link>
      </div>

      <div className="hidden grid-cols-12 grid-rows-2 gap-x-2 gap-y-2 lg:grid" dir="ltr">
        {visiblePosts.map((post, index) => {
          const isLargeCell = index === 2 || index === 7;
          return (
            <div
              key={post.id}
              className={`${DESKTOP_CELLS[index] ?? "hidden"} flex min-w-0 justify-center`}
              dir="ltr"
            >
              <PostCard post={post} forceVariant={isLargeCell ? "xl" : "sm"} />
            </div>
          );
        })}
      </div>

      <div
        className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-1 scrollbar-hide lg:hidden"
        dir="ltr"
      >
        {visiblePosts.map((post) => (
          <div key={post.id} className="w-[46vw] min-w-[156px] max-w-[210px] shrink-0 snap-start sm:w-[30vw]">
            <PostCard post={post} forceVariant={toMobilePostCardVariant(post.desktopVariant)} />
          </div>
        ))}
      </div>

      <Link
        href="/social"
        className="pressable mt-5 inline-flex items-center gap-2 text-sm font-medium text-white/90 transition-colors hover:text-white sm:hidden"
      >
        <span>برو به اینفینیتی‌گرام</span>
        <ArrowLeft className="size-4" strokeWidth={1.7} aria-hidden />
      </Link>
    </section>
  );
}
