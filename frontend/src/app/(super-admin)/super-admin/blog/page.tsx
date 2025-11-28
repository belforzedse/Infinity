"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import {
  FileText,
  FolderOpen,
  Tag,
  Users,
  MessageSquare,
  Plus,
  Eye,
  Clock,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import { blogService, BlogPost } from "@/services/blog/blog.service";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface Stats {
  posts: number;
  categories: number;
  tags: number;
  authors: number;
  pendingComments: number;
  totalViews: number;
}

export default function BlogDashboard() {
  const router = useRouter();
  const { isStoreManager } = useCurrentUser();
  const [stats, setStats] = useState<Stats>({
    posts: 0,
    categories: 0,
    tags: 0,
    authors: 0,
    pendingComments: 0,
    totalViews: 0,
  });
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect store managers away from blog pages
  useEffect(() => {
    if (isStoreManager) {
      router.replace("/super-admin");
    }
  }, [isStoreManager, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [postsRes, allPostsRes, categoriesRes, tagsRes, authorsRes, commentsRes] = await Promise.all([
          blogService.getBlogPosts({ pageSize: 5 }), // For recent posts display
          blogService.getBlogPosts({ pageSize: 1000 }), // For total views calculation
          blogService.getBlogCategories(),
          blogService.getBlogTags(),
          blogService.getBlogAuthors(),
          blogService.getAllBlogComments({ status: "Pending", pageSize: 100 }),
        ]);

        setRecentPosts(postsRes.data || []);

        const totalViews = (allPostsRes.data || []).reduce((sum, post) => sum + (post.ViewCount || 0), 0);

        setStats({
          posts: postsRes.meta?.totalItems || postsRes.data?.length || 0,
          categories: categoriesRes.data?.length || 0,
          tags: tagsRes.data?.length || 0,
          authors: authorsRes.data?.length || 0,
          pendingComments: commentsRes.meta?.totalItems || commentsRes.data?.length || 0,
          totalViews,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "مجموع پست‌ها",
      value: stats.posts,
      icon: FileText,
      color: "bg-pink-100",
      iconColor: "text-pink-600",
      href: "/super-admin/blog/posts",
    },
    {
      title: "دسته‌بندی‌ها",
      value: stats.categories,
      icon: FolderOpen,
      color: "bg-blue-100",
      iconColor: "text-blue-600",
      href: "/super-admin/blog/categories",
    },
    {
      title: "برچسب‌ها",
      value: stats.tags,
      icon: Tag,
      color: "bg-purple-100",
      iconColor: "text-purple-600",
      href: "/super-admin/blog/tags",
    },
    {
      title: "نویسندگان",
      value: stats.authors,
      icon: Users,
      color: "bg-green-100",
      iconColor: "text-green-600",
      href: "/super-admin/blog/authors",
    },
    {
      title: "نظرات در انتظار",
      value: stats.pendingComments,
      icon: MessageSquare,
      color: "bg-yellow-100",
      iconColor: "text-yellow-600",
      href: "/super-admin/blog/comments",
    },
    {
      title: "کل بازدیدها",
      value: stats.totalViews,
      icon: Eye,
      color: "bg-slate-100",
      iconColor: "text-slate-600",
      href: "/super-admin/blog/posts",
    },
  ];

  const quickActions = [
    {
      title: "نوشتن پست جدید",
      description: "ایجاد پست جدید برای وبلاگ",
      href: "/super-admin/blog/posts/add",
      icon: FileText,
      color: "bg-pink-500",
    },
    {
      title: "مدیریت دسته‌بندی‌ها",
      description: "افزودن و ویرایش دسته‌بندی‌های وبلاگ",
      href: "/super-admin/blog/categories",
      icon: FolderOpen,
      color: "bg-blue-500",
    },
    {
      title: "بررسی نظرات",
      description: "تایید و مدیریت نظرات کاربران",
      href: "/super-admin/blog/comments",
      icon: MessageSquare,
      color: "bg-yellow-500",
    },
  ];

  return (
    <ContentWrapper
      title="داشبورد وبلاگ"
      hasAddButton
      addButtonText="پست جدید"
      addButtonPath="/super-admin/blog/posts/add"
    >
      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            href={stat.href}
            className="rounded-2xl bg-white p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-neutral-900">
                  {loading ? "-" : stat.value.toLocaleString("fa-IR")}
                </p>
                <p className="text-xs text-neutral-500">{stat.title}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white p-5">
            <h3 className="mb-4 text-lg font-medium text-neutral-800">عملیات سریع</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:border-pink-200 hover:bg-pink-50"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-800">{action.title}</p>
                    <p className="text-xs text-neutral-500">{action.description}</p>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-neutral-800">آخرین پست‌ها</h3>
              <Link
                href="/super-admin/blog/posts"
                className="text-sm text-pink-500 hover:text-pink-600"
              >
                مشاهده همه
              </Link>
            </div>

            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
              </div>
            ) : recentPosts.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center">
                <FileText className="mb-3 h-12 w-12 text-slate-200" />
                <p className="text-neutral-600">هنوز پستی ایجاد نشده است</p>
                <Link
                  href="/super-admin/blog/posts/add"
                  className="mt-3 flex items-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-sm text-white transition-colors hover:bg-pink-600"
                >
                  <Plus className="h-4 w-4" />
                  اولین پست خود را ایجاد کنید
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/super-admin/blog/posts/${post.id}/edit`}
                    className="flex items-center gap-4 rounded-xl border border-slate-100 p-3 transition-colors hover:border-pink-200 hover:bg-pink-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-neutral-800">{post.Title}</p>
                      <div className="mt-1 flex items-center gap-4 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(post.createdAt).toLocaleDateString("fa-IR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.ViewCount || 0} بازدید
                        </span>
                        {post.blog_category && (
                          <span className="flex items-center gap-1">
                            <FolderOpen className="h-3 w-3" />
                            {post.blog_category.Name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        post.Status === "Published"
                          ? "bg-green-100 text-green-700"
                          : post.Status === "Scheduled"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {post.Status === "Published"
                        ? "منتشر شده"
                        : post.Status === "Scheduled"
                          ? "زمان‌بندی شده"
                          : "پیش‌نویس"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ContentWrapper>
  );
}
