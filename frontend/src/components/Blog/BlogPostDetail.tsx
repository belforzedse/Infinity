"use client";

import React from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Calendar,
  User,
  Eye,
  Tag as TagIcon,
  FolderOpen,
  Share2,
  ChevronLeft,
  Copy,
} from "lucide-react";
import { BlogPost } from "@/services/blog/blog.service";
import { IMAGE_BASE_URL } from "@/constants/api";
import { resolveBlogAuthorDisplayName } from "@/utils/blogAuthorName";

interface BlogPostDetailProps {
  post: BlogPost;
}

const BlogPostDetail: React.FC<BlogPostDetailProps> = ({ post }) => {
  const getImageUrl = () => {
    if (!post.FeaturedImage) return null;
    const url =
      post.FeaturedImage.formats?.large?.url ||
      post.FeaturedImage.formats?.medium?.url ||
      post.FeaturedImage.url;
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${IMAGE_BASE_URL}${url}`;
  };

  const getAvatarUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${IMAGE_BASE_URL}${url}`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.Title,
          text: post.Excerpt || post.Title,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast.success("لینک کپی شد!");
    }
  };

  return (
    <article className="lg:mx-8 overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* Breadcrumb */}
      <div className="border-b border-slate-100 px-6 py-4">
        <nav className="flex items-center gap-2 text-sm text-neutral-600">
          <Link href="/blog" className="transition-colors hover:text-pink-600">
            وبلاگ
          </Link>
          <ChevronLeft className="h-4 w-4" />
          {post.blog_category && (
            <>
              <Link
                href={`/blog?category=${post.blog_category.Slug}`}
                className="transition-colors hover:text-pink-600"
              >
                {post.blog_category.Name}
              </Link>
              <ChevronLeft className="h-4 w-4" />
            </>
          )}
          <span className="line-clamp-1 text-neutral-900">{post.Title}</span>
        </nav>
      </div>

      {/* Featured Image */}


      <div className="p-6 md:p-8">
        {/* Category Badge */}
        {post.blog_category && (
          <div className="mb-4">
            <Link
              href={`/blog?category=${post.blog_category.Slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-sm text-pink-700 transition-colors hover:bg-pink-200"
            >
              <FolderOpen className="h-4 w-4" />
              {post.blog_category.Name}
            </Link>
          </div>
        )}

        {/* Title */}
        <h1 className="mb-6 text-2xl font-bold leading-tight text-neutral-900 md:text-3xl">
          {post.Title}
        </h1>

        {/* Meta Information */}
        <div className="mb-8 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
            {post.blog_author && (
              <div className="flex items-center gap-2">
                {post.blog_author.Avatar?.url ? (
                  <img
                    src={getAvatarUrl(post.blog_author.Avatar.url) || ""}
                    alt={post.blog_author.Name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100">
                    <User className="h-4 w-4 text-pink-600" />
                  </div>
                )}
                <span className="font-medium">
                  {resolveBlogAuthorDisplayName(post.blog_author)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(post.PublishedAt || post.createdAt).toLocaleDateString("fa-IR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              <span>{post.ViewCount || 0} بازدید</span>
            </div>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-slate-200"
          >
            <Share2 className="h-4 w-4" />
            اشتراک‌گذاری
          </button>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-3xl">
          <div
            className="prose prose-md prose-neutral max-w-none prose-headings:font-bold prose-headings:text-neutral-900 prose-h1:text-3xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-p:text-neutral-700 prose-a:text-pink-600 prose-a:no-underline hover:prose-a:underline prose-pre:bg-slate-900 prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: post.Content }}
            dir="rtl"
          />
        </div>

        {/* Tags */}
        {post.blog_tags && post.blog_tags.length > 0 && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="mb-3 flex items-center gap-2">
              <TagIcon className="h-5 w-5 text-slate-400" />
              <span className="font-medium text-neutral-700">برچسب‌ها:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {post.blog_tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog?tag=${tag.Slug}`}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-neutral-600 transition-colors hover:bg-slate-200"
                  style={tag.Color ? { backgroundColor: `${tag.Color}15`, color: tag.Color } : {}}
                >
                  #{tag.Name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Updated Date */}
        {post.updatedAt !== post.createdAt && (
          <div className="mt-6 border-t border-slate-100 pt-6 text-sm text-neutral-500">
            آخرین بروزرسانی:{" "}
            {new Date(post.updatedAt).toLocaleDateString("fa-IR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        )}
      </div>
    </article>
  );
};

export default BlogPostDetail;
