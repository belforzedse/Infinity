"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  SocialPostCard,
  SocialPostOverlayBadge,
  toMobilePostCardVariant,
} from "@repo/social-posts/client";
import type { PostCardVariant } from "@repo/social-posts/client";
import type { SocialFeedPost } from "@repo/social-posts";

type InfinitygramSectionClientProps = {
  posts: readonly SocialFeedPost[];
};

const INFINITYGRAM_URL = "https://infinitygram.co";
const EXTERNAL_LINK_PROPS = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;

function hrefForPost(slug: string) {
  return `${INFINITYGRAM_URL}/post/${encodeURIComponent(slug)}`;
}

function desktopCellClass(post: SocialFeedPost) {
  return post.desktopVariant === "xl" ? "col-span-2 row-span-2" : "col-span-1 row-span-1";
}

function mobileCellClass(variant: PostCardVariant) {
  return variant === "mobile-lg" ? "col-span-2 sm:row-span-2" : "col-span-1";
}

function PostCard({
  post,
  variant,
  className,
}: {
  post: SocialFeedPost;
  variant: PostCardVariant;
  className?: string;
}) {
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
      linkTarget={EXTERNAL_LINK_PROPS.target}
      linkRel={EXTERNAL_LINK_PROPS.rel}
      linkAriaLabel={`مشاهده پست ${post.title || post.imageAlt}`}
      actionTone="light"
      overlay={post.overlay != null ? <SocialPostOverlayBadge type={post.overlay} /> : undefined}
    />
  );
}

export default function InfinitygramSectionClient({ posts }: InfinitygramSectionClientProps) {
  let xlCount = 0, smCount = 0;
  const visiblePosts = posts.filter((post) => {
    if (post.desktopVariant === "xl" && xlCount < 2) { xlCount++; return true; }
    if (post.desktopVariant === "sm" && smCount < 6) { smCount++; return true; }
    return false;
  });

  return (
    <section
      dir="rtl"
      aria-labelledby="home-infinitygram-heading"
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#252220] text-white"
    >
      <div className="mx-auto w-full max-w-[1360px] px-2 py-8 sm:px-5 lg:px-[60px] lg:py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2
            id="home-infinitygram-heading"
            className="flex items-center gap-2 text-right font-peyda-fanum text-3xl font-normal leading-[37px] text-white"
          >
            <span>از اینفینیتی‌گرام خرید کن</span>
            <span className="inline-flex size-6 items-center justify-center rounded-md bg-[#D52953] text-white shadow-sm">
              <img src="/Infinity.svg" alt="" width={18} height={18} className="block" />
            </span>
          </h2>

          <Link
            href={INFINITYGRAM_URL}
            target={EXTERNAL_LINK_PROPS.target}
            rel={EXTERNAL_LINK_PROPS.rel}
            className="pressable hidden shrink-0 items-center gap-2 text-sm font-medium text-white/90 transition-colors hover:text-white sm:inline-flex"
          >
            <span>برو به اینفینیتی‌گرام</span>
            <ArrowLeft className="size-4" strokeWidth={1.7} aria-hidden />
          </Link>
        </div>

        <div
          className="hidden w-full min-w-0 grid-flow-dense grid-cols-6 gap-x-1.5 gap-y-2 lg:grid"
          dir="ltr"
        >
          {visiblePosts.map((post) => (
            <div
              key={post.id}
              className={`${desktopCellClass(post)} flex min-w-0 justify-center`}
              dir="ltr"
            >
              <PostCard post={post} variant={post.desktopVariant} />
            </div>
          ))}
        </div>

        <div
          className="grid w-full min-w-0 grid-flow-dense grid-cols-2 gap-x-2 gap-y-2 sm:grid-cols-3 md:grid-cols-4 min-[900px]:grid-cols-5 lg:hidden"
          dir="ltr"
        >
          {visiblePosts.map((post) => {
            const variant = toMobilePostCardVariant(post.desktopVariant);

            return (
              <div
                key={post.id}
                className={`${mobileCellClass(variant)} flex min-w-0 justify-center`}
                dir="ltr"
              >
                <PostCard post={post} variant={variant} className="w-full" />
              </div>
            );
          })}
        </div>

        <Link
          href={INFINITYGRAM_URL}
          target={EXTERNAL_LINK_PROPS.target}
          rel={EXTERNAL_LINK_PROPS.rel}
          className="pressable mx-auto mt-5 flex w-fit items-center justify-center gap-2 text-sm font-medium text-white/90 transition-colors hover:text-white sm:hidden"
        >
          <span>برو به اینفینیتی‌گرام</span>
          <ArrowLeft className="size-4" strokeWidth={1.7} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
