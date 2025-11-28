"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import Modal from "@/components/Kits/Modal";
import {
  Search,
  Trash2,
  MessageCircle,
  Calendar,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from "lucide-react";
import { blogService, BlogComment } from "@/services/blog/blog.service";
import { resolveBlogCommentUserDisplayName } from "@/utils/blogCommentAuthorName";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const statusConfig = {
  Pending: { label: "در انتظار", className: "bg-yellow-100 text-yellow-700", icon: Clock },
  Approved: { label: "تایید شده", className: "bg-green-100 text-green-700", icon: CheckCircle },
  Rejected: { label: "رد شده", className: "bg-red-100 text-red-700", icon: XCircle },
};

export default function BlogCommentsPage() {
  const router = useRouter();
  const { isStoreManager } = useCurrentUser();
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect store managers away from blog pages
  useEffect(() => {
    if (isStoreManager) {
      router.replace("/super-admin");
    }
  }, [isStoreManager, router]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewComment, setViewComment] = useState<BlogComment | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await blogService.getAllBlogComments({
        pageSize: 100,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setComments(response.data || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
      toast.error("خطا در دریافت نظرات");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleStatusChange = async (id: number, newStatus: "Pending" | "Approved" | "Rejected") => {
    try {
      await blogService.updateBlogCommentStatus(id, newStatus);
      toast.success("وضعیت نظر با موفقیت تغییر کرد");
      fetchComments();
    } catch (err) {
      console.error("Error updating comment status:", err);
      toast.error("خطا در تغییر وضعیت نظر");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("آیا از حذف این نظر اطمینان دارید؟")) {
      try {
        await blogService.deleteBlogComment(id);
        toast.success("نظر با موفقیت حذف شد");
        fetchComments();
      } catch (err) {
        console.error("Error deleting comment:", err);
        toast.error("خطا در حذف نظر");
      }
    }
  };

  const normalizedSearch = searchTerm.toLowerCase();
  const filteredComments = comments.filter((comment) =>
    comment.Content.toLowerCase().includes(normalizedSearch) ||
    comment.Name?.toLowerCase().includes(normalizedSearch) ||
    comment.user?.username?.toLowerCase().includes(normalizedSearch)
  );

  const columns = [
    {
      accessorKey: "User",
      header: "کاربر",
      cell: ({ row }: { row: { original: BlogComment } }) => (
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-neutral-800">
              {resolveBlogCommentUserDisplayName(row.original.user, row.original.Name)}
            </span>
          </div>

        </div>
      ),
    },
    {
      accessorKey: "Content",
      header: "متن نظر",
      cell: ({ row }: { row: { original: BlogComment } }) => {
        const text = row.original.Content || "";
        const max = 40; // choose your limit

        const trimmed = text.length > max ? text.slice(0, max) + "..." : text;

        return (
          <div className="max-w-md">
            <p className="text-sm text-neutral-600">
              {trimmed}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "blog_post",
      header: "پست",
      cell: ({ row }: { row: { original: BlogComment } }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          {row.original.blog_post?.Title ? (
            <Link
              href={
                row.original.blog_post.Slug
                  ? `/blog/${row.original.blog_post.Slug}`
                  : "#"
              }
              target="_blank"
              className="truncate text-sm text-pink-600 transition-colors hover:text-pink-700 max-w-[150px]"
            >
              {row.original.blog_post.Title}
            </Link>
          ) : (
            <span className="text-sm text-neutral-500">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "Status",
      header: "وضعیت",
      cell: ({ row }: { row: { original: BlogComment } }) => {
        const config = statusConfig[row.original.Status];
        const Icon = config.icon;
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${config.className}`}>
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "تاریخ",
      cell: ({ row }: { row: { original: BlogComment } }) => (
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
      cell: ({ row }: { row: { original: BlogComment } }) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewComment(row.original)}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
            title="مشاهده"
          >
            <Eye className="h-4 w-4" />
          </button>
          {row.original.Status !== "Approved" && (
            <button
              type="button"
              onClick={() => handleStatusChange(row.original.id, "Approved")}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-green-50 text-green-600 transition-colors hover:bg-green-100"
              title="تایید"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          {row.original.Status !== "Rejected" && (
            <button
              type="button"
              onClick={() => handleStatusChange(row.original.id, "Rejected")}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-yellow-50 text-yellow-600 transition-colors hover:bg-yellow-100"
              title="رد"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
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

  // Stats
  const pendingCount = comments.filter((c) => c.Status === "Pending").length;
  const approvedCount = comments.filter((c) => c.Status === "Approved").length;
  const rejectedCount = comments.filter((c) => c.Status === "Rejected").length;

  return (
    <>
      <ContentWrapper title="مدیریت نظرات">
        {/* Stats */}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-neutral-900">{pendingCount}</p>
                <p className="text-sm text-neutral-500">در انتظار تایید</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-neutral-900">{approvedCount}</p>
                <p className="text-sm text-neutral-500">تایید شده</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-neutral-900">{rejectedCount}</p>
                <p className="text-sm text-neutral-500">رد شده</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-4 rounded-2xl bg-white p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو در نظرات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-100 bg-white py-2.5 pl-4 pr-10 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-neutral-600 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="Pending">در انتظار</option>
              <option value="Approved">تایید شده</option>
              <option value="Rejected">رد شده</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-white">
          <SuperAdminTable data={filteredComments} columns={columns} loading={loading} />
        </div>
      </ContentWrapper>

      <Modal
        isOpen={!!viewComment}
        onClose={() => setViewComment(null)}
        title="جزئیات نظر"
        className="max-w-2xl"
      >
        {viewComment && (
          <div className="space-y-4 text-sm text-neutral-700">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-neutral-900">
                {resolveBlogCommentUserDisplayName(viewComment.user, viewComment.Name)}
              </span>
              {viewComment.user?.email && (
                <span className="text-xs text-neutral-500">{viewComment.user.email}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              {viewComment.blog_post?.Title ? (
                <Link
                  href={viewComment.blog_post.Slug ? `/blog/${viewComment.blog_post.Slug}` : "#"}
                  target="_blank"
                  className="text-pink-600 hover:text-pink-700"
                >
                  {viewComment.blog_post.Title}
                </Link>
              ) : (
                <span>-</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>{new Date(viewComment.createdAt).toLocaleDateString("fa-IR")}</span>
            </div>
            <div>
              <p className="mb-1 text-xs text-neutral-500">متن نظر</p>
              <p className="whitespace-pre-wrap text-neutral-800">{viewComment.Content}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-neutral-500">وضعیت</p>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusConfig[viewComment.Status].className}`}
              >
                {statusConfig[viewComment.Status].label}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </>
  );

}
