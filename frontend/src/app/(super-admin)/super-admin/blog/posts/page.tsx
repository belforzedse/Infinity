"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  FolderOpen,
} from "lucide-react";
import { blogService, BlogPost } from "@/services/blog/blog.service";

const statusConfig = {
  Draft: { label: "پیش‌نویس", className: "bg-slate-100 text-slate-700" },
  Published: { label: "منتشر شده", className: "bg-green-100 text-green-700" },
  Scheduled: { label: "زمان‌بندی شده", className: "bg-blue-100 text-blue-700" },
};

export default function BlogPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await blogService.getBlogPosts({
        pageSize: 100,
        sort: "createdAt:desc",
        status: statusFilter !== "all" ? (statusFilter as "Draft" | "Published" | "Scheduled") : undefined,
        search: searchTerm || undefined,
      });
      setPosts(response.data || []);
    } catch (err) {
      console.error("Error fetching blog posts:", err);
      toast.error("خطا در دریافت پست‌ها");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (id: number) => {
    if (confirm("آیا از حذف این پست اطمینان دارید؟")) {
      try {
        await blogService.deleteBlogPost(id);
        toast.success("پست با موفقیت حذف شد");
        fetchPosts();
      } catch (err) {
        console.error("Error deleting post:", err);
        toast.error("خطا در حذف پست");
      }
    }
  };

  const columns = [
    {
      accessorKey: "Title",
      header: "عنوان",
      cell: ({ row }: { row: { original: BlogPost } }) => (
        <div className="max-w-xs">
          <div className="truncate font-medium text-neutral-900">{row.original.Title}</div>
          <div className="truncate text-xs text-neutral-500">/{row.original.Slug}</div>
        </div>
      ),
    },
    {
      accessorKey: "blog_author",
      header: "نویسنده",
      cell: ({ row }: { row: { original: BlogPost } }) => {
        const author = row.original.blog_author;
        const ui = author?.user_info || author?.local_user?.user_info;
        const displayName =
          [ui?.FirstName, ui?.LastName].filter(Boolean).join(" ").trim() ||
          author?.Name ||
          "نامشخص";
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-neutral-700">{displayName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "blog_category",
      header: "دسته‌بندی",
      cell: ({ row }: { row: { original: BlogPost } }) => (
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-neutral-700">
            {row.original.blog_category?.Name || "بدون دسته‌بندی"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "Status",
      header: "وضعیت",
      cell: ({ row }: { row: { original: BlogPost } }) => {
        const config = statusConfig[row.original.Status];
        return (
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${config.className}`}>
            {config.label}
          </span>
        );
      },
    },
    {
      accessorKey: "ViewCount",
      header: "بازدید",
      cell: ({ row }: { row: { original: BlogPost } }) => (
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-neutral-700">{row.original.ViewCount || 0}</span>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "تاریخ ایجاد",
      cell: ({ row }: { row: { original: BlogPost } }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-neutral-700">
            {new Date(row.original.createdAt).toLocaleDateString("fa-IR")}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "عملیات",
      cell: ({ row }: { row: { original: BlogPost } }) => (
        <div className="flex items-center gap-1">
          <Link href={`/${row.original.Slug}`} target="_blank">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
              title="مشاهده"
            >
              <Eye className="h-4 w-4" />
            </button>
          </Link>
          <Link href={`/super-admin/blog/posts/${row.original.id}/edit`}>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
              title="ویرایش"
            >
              <Edit className="h-4 w-4" />
            </button>
          </Link>
          <button
            type="button"
            onClick={() => handleDelete(row.original.id)}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-600 transition-colors hover:bg-red-100"
            title="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ContentWrapper
      title="مدیریت پست‌ها"
      hasAddButton
      addButtonText="پست جدید"
      addButtonPath="/super-admin/blog/posts/add"
    >
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-4 rounded-2xl bg-white p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="جستجو در پست‌ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-100 bg-white py-2.5 pr-10 pl-4 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-neutral-600 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="Draft">پیش‌نویس</option>
            <option value="Published">منتشر شده</option>
            <option value="Scheduled">زمان‌بندی شده</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white">
        <SuperAdminTable
          data={posts}
          columns={columns}
          loading={loading}
        />
      </div>
    </ContentWrapper>
  );
}
