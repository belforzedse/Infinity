"use client";

import React from "react";
import Link from "next/link";
import { Calendar, LayoutGrid } from "lucide-react";
import BlurImage from "@/components/ui/BlurImage";
import imageLoader from "@/utils/imageLoader";
import { IMAGE_BASE_URL } from "@/constants/api";
import type { BlogPost } from "@/services/blog/blog.service";
import { resolveBlogAuthorDisplayName } from "@/utils/blogAuthorName";

interface BlogCardProps {
  post: BlogPost;
  priority?: boolean;
  className?: string;
}

const BlogCard: React.FC<BlogCardProps> = ({ post, priority = false, className = "" }) => {
  const getImageUrl = () => {
    if (!post.FeaturedImage) return null;
    const url =
      post.FeaturedImage.formats?.medium?.url ||
      post.FeaturedImage.formats?.small?.url ||
      post.FeaturedImage.url;
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${IMAGE_BASE_URL}${url}`;
  };

  const imageUrl = getImageUrl();

  return (
    <article className={`group w-full max-w-none ${className}`}>
      <Link
        href={`/${post.Slug}`}
        className="block rounded-3xl bg-white border-2 border-pink-100 p-2 transition-all duration-200 hover:shadow-md hover:border-pink-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
      >
        {/* Featured Image */}
        <div className="relative aspect-[304/260] w-full overflow-hidden rounded-[20px] mb-2">
          {imageUrl ? (
            <BlurImage
              src={imageUrl}
              alt={post.Title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 328px"
              priority={priority}
              loader={imageLoader}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-50 to-pink-100" />
          )}

          {/* Watermark */}
          <div className="absolute top-3 left-3 z-10">
            <span className="text-xs font-medium text-neutral-600 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg">
              اینفینیتی
            </span>
          </div>
        </div>

        {/* Metadata Row */}
        <div className="flex items-center justify-between mb-2">
          {/* Category */}
          <div className="flex items-center gap-1">
            <LayoutGrid className="h-4 w-4 text-neutral-400" />
            <span className="text-xs text-neutral-400 leading-[1.74]">
              {post.blog_category?.Name || 'اینفینیتی'}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-neutral-400" />
            <span className="text-xs text-neutral-400 leading-[1.74]">
              {new Date(post.PublishedAt || post.createdAt).toLocaleDateString("fa-IR")}
            </span>
          </div>
        </div>

        {/* Author Row */}
        {post.blog_author && (
          <div className="flex items-center justify-end mb-2">
            <span className="text-xs text-neutral-500 leading-[1.74]">
              نویسنده: {resolveBlogAuthorDisplayName(post.blog_author)}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col items-end gap-1">
          {/* Title */}
          <h3 className="text-base font-medium text-neutral-700 text-right line-clamp-2 leading-[1.8] w-full">
            {post.Title}
          </h3>

          {/* Excerpt */}
          {post.Excerpt && (
            <p className="text-xs text-neutral-400 text-right line-clamp-2 leading-[1.74] w-full">
              {post.Excerpt}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
};

export default BlogCard;
