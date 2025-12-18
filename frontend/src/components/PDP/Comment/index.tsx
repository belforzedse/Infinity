"use client";

import React, { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { productReviewService, ProductReview } from "@/services/product/product-review.service";
import PDPCommentAdd from "./Add";
import PDPCommentList from "./List";

type Props = {
  rating: number;
  rateCount: number;
  productReviews: ProductReview[];
  productId?: string;
  productData?: any;
};

export default function PDPComment(props: Props) {
  const { rating, rateCount, productReviews: initialReviews, productId, productData } = props;
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    try {
      const response = await productReviewService.getProductReviews(productId);
      setReviews(response.data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  }, [productId]);

  const handleStatusUpdate = async (id: number, status: "Accepted" | "Rejected") => {
    try {
      await productReviewService.updateStatus(id, status);
      toast.success(status === "Accepted" ? "دیدگاه تایید شد" : "دیدگاه رد شد");
      await fetchReviews();
    } catch (error) {
      toast.error("خطا در تغییر وضعیت دیدگاه");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این دیدگاه اطمینان دارید؟")) return;
    try {
      await productReviewService.deleteReview(id);
      toast.success("دیدگاه حذف شد");
      await fetchReviews();
    } catch (error) {
      toast.error("خطا در حذف دیدگاه");
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
          onDelete={handleDelete}
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
    </div>
  );
}
