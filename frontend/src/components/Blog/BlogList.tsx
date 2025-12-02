"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  User,
  Eye,
  Tag as TagIcon,
  FolderOpen,
  ArrowLeft,
} from "lucide-react";
import { blogService, BlogPost, BlogCategory, BlogTag } from "@/services/blog/blog.service";
import { IMAGE_BASE_URL } from "@/constants/api";

interface BlogListProps {
  posts?: BlogPost[];
  categories?: BlogCategory[];
  tags?: BlogTag[];
}

const BlogList: React.FC<BlogListProps> = ({
  posts: initialPosts,
  categories: initialCategories,
  tags: initialTags,
}) => {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts || []);
  const [categories, setCategories] = useState<BlogCategory[]>(initialCategories || []);
  const [tags, setTags] = useState<BlogTag[]>(initialTags || []);
  const [loading, setLoading] = useState(!initialPosts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");

  useEffect(() => {
    if (!initialPosts) {
      fetchData();
    }
  }, [initialPosts]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [postsResponse, categoriesResponse, tagsResponse] = await Promise.all([
        blogService.getBlogPosts({ pageSize: 20, status: "Published" }),
        blogService.getBlogCategories(),
        blogService.getBlogTags(),
      ]);

      setPosts(postsResponse.data || []);
      setCategories(categoriesResponse.data || []);
      setTags(tagsResponse.data || []);
    } catch (error) {
      console.error("Error fetching blog data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.Excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || post.blog_category?.Slug === selectedCategory;
    const matchesTag = !selectedTag || post.blog_tags?.some((tag) => tag.Slug === selectedTag);

    return matchesSearch && matchesCategory && matchesTag;
  });

  const getImageUrl = (post: BlogPost) => {
    if (!post.FeaturedImage) return null;
    const url =
      post.FeaturedImage.formats?.medium?.url ||
      post.FeaturedImage.formats?.small?.url ||
      post.FeaturedImage.url;
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${IMAGE_BASE_URL}${url}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="animate-pulse space-y-6">
            <div className="h-32 rounded-2xl bg-slate-200"></div>
            <div className="h-48 rounded-2xl bg-slate-200"></div>
            <div className="h-32 rounded-2xl bg-slate-200"></div>
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="mb-4 aspect-video rounded-2xl bg-slate-200"></div>
                <div className="space-y-2">
                  <div className="h-4 w-3/4 rounded bg-slate-200"></div>
                  <div className="h-4 w-1/2 rounded bg-slate-200"></div>
                  <div className="h-20 rounded bg-slate-200"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
      {/* Sidebar Filters */}
      <div className="lg:col-span-1">
        <div className="sticky top-8 space-y-6">
          {/* Search */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-medium text-neutral-900">جستجو</h3>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="جستجو در مقالات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-100 bg-white py-3 pr-10 pl-4 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-medium text-neutral-900">دسته‌بندی‌ها</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-sm transition-colors ${
                    !selectedCategory
                      ? "bg-pink-100 text-pink-700"
                      : "text-neutral-700 hover:bg-slate-50"
                  }`}
                >
                  <FolderOpen className="h-4 w-4" />
                  همه دسته‌بندی‌ها
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.Slug)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-sm transition-colors ${
                      selectedCategory === category.Slug
                        ? "bg-pink-100 text-pink-700"
                        : "text-neutral-700 hover:bg-slate-50"
                    }`}
                  >
                    <FolderOpen className="h-4 w-4" />
                    {category.Name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-medium text-neutral-900">برچسب‌ها</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTag(selectedTag === tag.Slug ? "" : tag.Slug)}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      selectedTag === tag.Slug
                        ? "bg-pink-100 text-pink-700"
                        : "bg-slate-100 text-neutral-600 hover:bg-slate-200"
                    }`}
                    style={
                      selectedTag === tag.Slug && tag.Color
                        ? { backgroundColor: `${tag.Color}20`, color: tag.Color }
                        : {}
                    }
                  >
                    #{tag.Name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Posts Grid */}
      <div className="lg:col-span-3">
        {filteredPosts.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <TagIcon className="mx-auto mb-4 h-16 w-16 text-slate-200" />
            <h3 className="mb-2 text-lg font-medium text-neutral-900">هیچ مقاله‌ای یافت نشد</h3>
            <p className="text-neutral-600">
              {searchTerm || selectedCategory || selectedTag
                ? "لطفاً فیلترهای خود را تغییر دهید"
                : "هنوز مقاله‌ای منتشر نشده است"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Featured Image */}
                {getImageUrl(post) && (
                  <Link href={`/${post.Slug}`} className="block aspect-video overflow-hidden">
                    <img
                      src={getImageUrl(post)!}
                      alt={post.Title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </Link>
                )}

                <div className="p-5">
                  {/* Category */}
                  {post.blog_category && (
                    <div className="mb-3">
                      <Link
                        href={`/blog?category=${post.blog_category.Slug}`}
                        className="inline-block rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-700 transition-colors hover:bg-pink-200"
                      >
                        {post.blog_category.Name}
                      </Link>
                    </div>
                  )}

                  {/* Title */}
                  <h2 className="mb-3 line-clamp-2 text-lg font-semibold text-neutral-900">
                    <Link
                      href={`/${post.Slug}`}
                      className="transition-colors hover:text-pink-600"
                    >
                      {post.Title}
                    </Link>
                  </h2>

                  {/* Excerpt */}
                  {post.Excerpt && (
                    <p className="mb-4 line-clamp-2 text-sm text-neutral-600">{post.Excerpt}</p>
                  )}

                  {/* Meta Info */}
                  <div className="mb-4 flex items-center justify-between text-xs text-neutral-500">
                    <div className="flex items-center gap-3">
                      {post.blog_author && (
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          <span>{post.blog_author.Name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(post.PublishedAt || post.createdAt).toLocaleDateString("fa-IR")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{post.ViewCount || 0}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {post.blog_tags && post.blog_tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {post.blog_tags.slice(0, 3).map((tag) => (
                        <Link
                          key={tag.id}
                          href={`/blog?tag=${tag.Slug}`}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-neutral-600 transition-colors hover:bg-slate-200"
                        >
                          #{tag.Name}
                        </Link>
                      ))}
                      {post.blog_tags.length > 3 && (
                        <span className="text-xs text-neutral-400">
                          +{post.blog_tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Read More */}
                  <Link
                    href={`/${post.Slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-pink-600 transition-colors hover:text-pink-700"
                  >
                    ادامه مطلب
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogList;
