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
  MessageSquare,
  Calendar,
  User,
  ShoppingBag,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Star,
} from "lucide-react";
import { productReviewService, ProductReview } from "@/services/product/product-review.service";
import { resolveProductReviewUserDisplayName } from "@/utils/productReviewAuthorName";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { translateCommentStatus } from "@/utils/statusTranslations";

const statusConfig = {
  "Need for Review": { className: "bg-yellow-100 text-yellow-700", icon: Clock },
  Accepted: { className: "bg-green-100 text-green-700", icon: CheckCircle },
  Rejected: { className: "bg-red-100 text-red-700", icon: XCircle },
};

export default function ProductsCommentsPage() {
  const router = useRouter();
  const { roleName } = useCurrentUser();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewReview, setViewReview] = useState<ProductReview | null>(null);

  // Redirect editors away from product pages
  useEffect(() => {
    const normalizedRole = (roleName ?? "").toLowerCase().trim();
    if (normalizedRole === "editor") {
      router.replace("/super-admin/blog");
    }
  }, [roleName, router]);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productReviewService.getAllReviews({
        pageSize: 100,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setReviews(response.data || []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      toast.error("خطا در دریافت دیدگاه‌ها");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleStatusChange = async (id: number, newStatus: "Need for Review" | "Accepted" | "Rejected") => {
    try {
      await productReviewService.updateStatus(id, newStatus);
      toast.success("وضعیت دیدگاه با موفقیت تغییر کرد");
      fetchReviews();
    } catch (err) {
      console.error("Error updating review status:", err);
      toast.error("خطا در تغییر وضعیت دیدگاه");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("آیا از حذف این دیدگاه اطمینان دارید؟")) {
      try {
        await productReviewService.deleteReview(id);
        toast.success("دیدگاه با موفقیت حذف شد");
        fetchReviews();
      } catch (err) {
        console.error("Error deleting review:", err);
        toast.error("خطا در حذف دیدگاه");
      }
    }
  };

  const normalizedSearch = searchTerm.toLowerCase();
  const filteredReviews = reviews.filter((review) => {
    const content = (review.Content || "").toLowerCase();
    const phone = (review.user?.Phone || "").toLowerCase();
    const productName = (review.product?.Title || "").toLowerCase();
    const displayName = resolveProductReviewUserDisplayName(review.user).toLowerCase();
    
    return (
      content.includes(normalizedSearch) ||
      phone.includes(normalizedSearch) ||
      productName.includes(normalizedSearch) ||
      displayName.includes(normalizedSearch)
    );
  });

  const columns = [
    {
      accessorKey: "User",
      header: "کاربر",
      cell: ({ row }: { row: { original: ProductReview } }) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-neutral-800">
              {resolveProductReviewUserDisplayName(row.original.user, row.original.user?.Phone)}
            </span>
          </div>
          {row.original.user?.Phone && (
            <span className="text-[10px] text-neutral-500 mr-6">{row.original.user.Phone}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "Content",
      header: "متن دیدگاه",
      cell: ({ row }: { row: { original: ProductReview } }) => {
        const text = row.original.Content || "";
        const trimmed = text.length > 50 ? text.slice(0, 50) + "..." : text;
        return (
          <div className="max-w-xs">
            <p className="text-sm text-neutral-600 leading-relaxed">{trimmed}</p>
            <div className="mt-1 flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < row.original.Rate ? "fill-yellow-400 text-yellow-400" : "text-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "product",
      header: "محصول",
      cell: ({ row }: { row: { original: ProductReview } }) => (
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-slate-400" />
          {row.original.product?.Title ? (
            <span className="truncate text-sm text-neutral-700 max-w-[150px]">
              {row.original.product.Title}
            </span>
          ) : (
            <span className="text-sm text-neutral-500">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "Status",
      header: "وضعیت",
      cell: ({ row }: { row: { original: ProductReview } }) => {
        const config = statusConfig[row.original.Status] || statusConfig["Need for Review"];
        const Icon = config.icon;
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
            <Icon className="h-3 w-3" />
            {translateCommentStatus(row.original.Status)}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "تاریخ",
      cell: ({ row }: { row: { original: ProductReview } }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-xs text-neutral-700">
            {new Date(row.original.createdAt).toLocaleDateString("fa-IR")}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "عملیات",
      cell: ({ row }: { row: { original: ProductReview } }) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewReview(row.original)}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
            title="مشاهده"
          >
            <Eye className="h-4 w-4" />
          </button>
          {row.original.Status !== "Accepted" && (
            <button
              type="button"
              onClick={() => handleStatusChange(row.original.id, "Accepted")}
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
  const pendingCount = reviews.filter((r) => r.Status === "Need for Review").length;
  const approvedCount = reviews.filter((r) => r.Status === "Accepted").length;
  const rejectedCount = reviews.filter((r) => r.Status === "Rejected").length;

  return (
    <>
      <ContentWrapper title="مدیریت دیدگاه‌های محصولات">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{pendingCount}</p>
                <p className="text-sm text-neutral-500">در انتظار بررسی</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{approvedCount}</p>
                <p className="text-sm text-neutral-500">تایید شده</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{rejectedCount}</p>
                <p className="text-sm text-neutral-500">رد شده</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو در متن، نام کاربر، شماره تلفن یا محصول..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-100 bg-slate-50 py-2.5 pl-4 pr-10 text-sm text-neutral-700 placeholder:text-slate-400 focus:border-pink-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/10"
            />
          </div>
          <div className="sm:w-56">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-neutral-700 focus:border-pink-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/10"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="Need for Review">در انتظار تایید</option>
              <option value="Accepted">تایید شده</option>
              <option value="Rejected">رد شده</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <SuperAdminTable data={filteredReviews} columns={columns} loading={loading} />
        </div>
      </ContentWrapper>

      {/* View Review Modal */}
      <Modal
        isOpen={!!viewReview}
        onClose={() => setViewReview(null)}
        title="جزئیات دیدگاه محصول"
        className="max-w-2xl"
      >
        {viewReview && (
          <div className="space-y-6 text-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-neutral-400">کاربر</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-neutral-900">
                    {resolveProductReviewUserDisplayName(viewReview.user, viewReview.user?.Phone)}
                  </span>
                </div>
                {viewReview.user?.Phone && (
                  <p className="text-xs text-neutral-500 mr-6">{viewReview.user.Phone}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-neutral-400">محصول</p>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-neutral-900">{viewReview.product?.Title || "-"}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-neutral-400">تاریخ ثبت</p>
                <div className="flex items-center gap-2 text-neutral-700">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>{new Date(viewReview.createdAt).toLocaleString("fa-IR")}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-neutral-400">امتیاز</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < viewReview.Rate ? "fill-yellow-400 text-yellow-400" : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="mb-2 text-xs text-neutral-400">متن دیدگاه</p>
              <p className="whitespace-pre-wrap leading-relaxed text-neutral-800">
                {viewReview.Content}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400">وضعیت فعلی:</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig[viewReview.Status]?.className || statusConfig["Need for Review"].className}`}>
                  {translateCommentStatus(viewReview.Status)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleStatusChange(viewReview.id, "Accepted");
                    setViewReview(null);
                  }}
                  className="rounded-lg bg-green-500 px-4 py-2 text-xs font-bold text-white hover:bg-green-600 transition-colors"
                >
                  تایید
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleStatusChange(viewReview.id, "Rejected");
                    setViewReview(null);
                  }}
                  className="rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 transition-colors"
                >
                  رد کردن
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
