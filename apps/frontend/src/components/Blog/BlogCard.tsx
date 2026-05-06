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
        className="block rounded-3xl border-2 border-pink-100 bg-white p-2 transition-all duration-200 hover:border-pink-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
      >
        {/* Featured Image */}
        <div className="relative mb-2 aspect-[304/260] w-full overflow-hidden rounded-[20px]">
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
            <div className="h-full w-full bg-gradient-to-br from-pink-50 to-pink-100" />
          )}
        </div>

        {/* Metadata Row */}
        <div className="mb-2 flex items-center justify-between">
          {/* Category and date*/}
          <div className="flex items-center gap-1">
            <LayoutGrid className="h-4 w-4 text-neutral-400" />
            <span className="text-xs leading-[1.74] text-neutral-400">
              {post.blog_category?.Name || "اینفینیتی"}
            </span>
            <Calendar className="h-4 w-4 text-neutral-400" />
            <span className="text-xs leading-[1.74] text-neutral-400">
              {new Date(post.PublishedAt || post.createdAt).toLocaleDateString("fa-IR")}
            </span>
          </div>
        </div>




        {/* Content */}
        <div className="flex flex-col items-end gap-1">
          {/* Title */}
          <h3 className="line-clamp-2 w-full text-right text-lg font-medium leading-24 text-neutral-700">
            {post.Title}
          </h3>

          {/* Excerpt */}
            <p className="line-clamp-2 w-full text-right text-xs leading-[1.74] text-neutral-400">
              {post.Excerpt || post.ShortContent}
            </p>
</div>
      </Link>
    </article>
  );
};

export default BlogCard;
