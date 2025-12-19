"use client";

import React, { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { productReviewService, ProductReview } from "@/services/product/product-review.service";
import type { ProductDetail } from "@/services/product/product";
import Modal from "@/components/Kits/Modal";
import PDPCommentAdd from "./Add";
import PDPCommentList from "./List";

type Props = {
  rating: number;
  rateCount: number;
  productReviews: ProductReview[];
  productId?: string;
  productData?: ProductDetail;
};

export default function PDPComment(props: Props) {
  const { rating, rateCount, productReviews: initialReviews, productId, productData } = props;
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const canRenderModal = typeof document !== "undefined";

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    try {
      const response = await productReviewService.getProductReviews(productId);
      setReviews(response.data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("خطا در دریافت دیدگاه‌ها. لطفاً دوباره تلاش کنید.");
    }
  }, [productId]);

  const handleStatusUpdate = async (id: number, status: "Accepted" | "Rejected") => {
    try {
      await productReviewService.updateStatus(id, status);
      toast.success(status === "Accepted" ? "دیدگاه تایید شد" : "دیدگاه رد شد");
      await fetchReviews();
    } catch (_error) {
      toast.error("خطا در تغییر وضعیت دیدگاه");
    }
  };

  const handleDelete = async (id: number): Promise<boolean> => {
    try {
      setIsDeleting(true);
      await productReviewService.deleteReview(id);
      toast.success("دیدگاه حذف شد");
      await fetchReviews();
      return true;
    } catch (_error) {
      toast.error("خطا در حذف دیدگاه");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteRequest = (id: number) => {
    if (!canRenderModal) return;
    setPendingDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleDeleteCancel = () => {
    if (isDeleting) return;
    setIsConfirmOpen(false);
    setPendingDeleteId(null);
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeleteId === null) return;
    const isDeleted = await handleDelete(pendingDeleteId);
    if (isDeleted) {
      setIsConfirmOpen(false);
      setPendingDeleteId(null);
    }
  };

  const handleLike = (id: number) => {
    toast.success("از ثبت امتیاز شما سپاسگزاریم");
  };

  const handleDislike = (id: number) => {
    toast.success("از ثبت امتیاز شما سپاسگزاریم");
  };

  const handleReply = (id: number) => {
    toast.error("ثبت پاسخ بزودی فعال خواهد شد");
  };

  return (
    <div
      className="flex flex-col-reverse gap-4 md:flex-row"
      data-comments-section
      dir="rtl"
      style={{ scrollMarginTop: "var(--header-offset, 88px)" }}
    >
      <div className="flex-1">
        <PDPCommentList
          reviews={reviews}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDeleteRequest}
          onLike={handleLike}
          onDislike={handleDislike}
          onReply={handleReply}
        />
      </div>

      <div className="flex flex-col-reverse gap-4 md:w-[386px] md:flex-col">
        <PDPCommentAdd
          rating={rating}
          rateCount={rateCount}
          productReviews={reviews}
          productId={productId}
          productData={productData}
          onReviewSubmitted={fetchReviews}
        />
      </div>

      {canRenderModal && (
        <Modal
          isOpen={isConfirmOpen}
          onClose={handleDeleteCancel}
          title="حذف دیدگاه"
          className="max-w-md"
        >
          <div className="space-y-4 text-sm text-neutral-700">
            <p>آیا از حذف این دیدگاه اطمینان دارید؟</p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "در حال حذف..." : "حذف"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
