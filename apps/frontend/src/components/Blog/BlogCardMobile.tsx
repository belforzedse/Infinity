"use client";

import React from "react";
import Link from "next/link";
import { Calendar, LayoutGrid } from "lucide-react";
import BlurImage from "@/components/ui/BlurImage";
import imageLoader from "@/utils/imageLoader";
import { IMAGE_BASE_URL } from "@/constants/api";
import type { BlogPost } from "@/services/blog/blog.service";
import { resolveBlogAuthorDisplayName } from "@/utils/blogAuthorName";

interface BlogCardMobileProps {
  post: BlogPost;
  priority?: boolean;
  className?: string;
}

const BlogCardMobile: React.FC<BlogCardMobileProps> = ({
  post,
  priority = false,
  className = "",
}) => {
  const getImageUrl = () => {
    if (!post.FeaturedImage) return null;
    const url =
      post.FeaturedImage.formats?.small?.url ||
      post.FeaturedImage.url;
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${IMAGE_BASE_URL}${url}`;
  };

  const imageUrl = getImageUrl();
  const publishedDate = new Date(post.PublishedAt || post.createdAt).toLocaleDateString("fa-IR");
  const categoryName = post.blog_category?.Name || "اینفینیتی";
  const excerpt = post.Excerpt || post.ShortContent;

  return (
    <article className={`group w-full min-w-0 ${className}`}>
      <Link
        href={`/${post.Slug}`}
        className="block overflow-hidden rounded-2xl border-2 border-infinity-primary-lighter/40 bg-white transition-all duration-200 hover:border-infinity-primary-lighter/60 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-infinity-primary-lighter/20 to-infinity-primary-lighter/30">
          {imageUrl ? (
            <BlurImage
              src={imageUrl}
              alt={post.Title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 361px"
              priority={priority}
              loader={imageLoader}
            />
          ) : null}

          <div className="absolute start-2 top-2 z-10">
            <span className="rounded bg-white/85 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 backdrop-blur-sm">
              اینفینیتی
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-3 text-right">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
            <span className="inline-flex items-center gap-1">
              <LayoutGrid className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="line-clamp-1">{categoryName}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{publishedDate}</span>
            </span>
          </div>

          <h3 className="line-clamp-2 text-base font-medium leading-snug text-neutral-700">
            {post.Title}
          </h3>

          {post.blog_author && (
            <p className="line-clamp-1 text-xs text-neutral-500">
              نویسنده: {resolveBlogAuthorDisplayName(post.blog_author)}
            </p>
          )}

          {excerpt ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-neutral-400">{excerpt}</p>
          ) : null}
        </div>
      </Link>
    </article>
  );
};

export default BlogCardMobile;
