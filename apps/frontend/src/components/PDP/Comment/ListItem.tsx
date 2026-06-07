import React from "react";
import { User, CheckCircle, XCircle, Trash2 } from "lucide-react";
import ReplyIcon from "../Icons/ReplyIcon";
import ThumbsDownIcon from "../Icons/ThumbsDownIcon";
import ThumbsUpIcon from "../Icons/ThumbsUpIcon";
import StarIcon from "../Icons/StarIcon";
import EmptyStarIcon from "../Icons/EmptyStarIcon";
import type { ProductReview, ProductReviewReply } from "@/services/product/product-review.service";
import { resolveProductReviewUserDisplayName } from "@/utils/productReviewAuthorName";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import dayjs from "dayjs";
import jalaliday from "jalaliday";

dayjs.extend(jalaliday);

interface Props {
  review: ProductReview;
  isReply?: boolean;
  onStatusUpdate?: (id: number, status: "Accepted" | "Rejected") => void;
  onDelete?: (id: number) => void;
  onLike?: (id: number) => void;
  onDislike?: (id: number) => void;
  onReply?: (id: number) => void;
}

export default function PDPCommentListItem({
  review,
  isReply = false,
  onStatusUpdate,
  onDelete,
  onLike,
  onDislike,
  onReply,
}: Props) {
  const { isAdmin } = useCurrentUser();
  const displayName = resolveProductReviewUserDisplayName(review.user, review.user?.Phone);

  const formatDate = (dateString: string) => {
    try {
      const date = dayjs(dateString);
      if (!date.isValid()) return "تاریخ نامشخص";
      return (date as any).calendar("jalali").locale("fa").format("YYYY MMMM DD");
    } catch (error) {
      return "تاریخ نامشخص";
    }
  };

  const mapReplyToReview = (reply: ProductReviewReply): ProductReview => {
    return {
      id: reply.id,
      Content: reply.Content,
      Status: "Accepted",
      Date: reply.createdAt,
      Rate: 0,
      LikeCounts: 0,
      DislikeCounts: 0,
      user: reply.user,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
      product_review_replies: [],
    };
  };

  return (
    <div
      className={`rounded-[20px] border border-slate-100 bg-[#FAFAF9] p-6 flex flex-col gap-[10px] ${isReply ? "mr-8 mt-4 bg-white shadow-sm" : "mb-4"}`}
    >
      {/* Review Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
            <User className="h-6 w-6 text-slate-400" />
          </div>
          <div className="flex flex-col gap-[6px]">
            <div className="text-[18px] font-medium text-[#262626] leading-[1.238]">
              {displayName}
            </div>
            <div className="text-[12px] text-[#B3B6B3]">
              {formatDate(review.Date || review.createdAt)}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            {!isReply && (
              <button
                type="button"
                onClick={() => onReply?.(review.id)}
                className="text-[#94A3B8] hover:text-[#33415e] transition-colors"
              >
                <ReplyIcon />
              </button>
            )}
            <div className="flex items-center gap-1 text-[#525252]">
              <span className="text-[12px] font-medium leading-[1]">
                {review.DislikeCounts || 0}
              </span>
              <button
                type="button"
                onClick={() => onDislike?.(review.id)}
                className="hover:text-red-500 transition-colors flex items-center justify-center"
              >
                <ThumbsDownIcon />
              </button>
            </div>
            <div className="flex items-center gap-1 text-[#525252]">
              <span className="text-[12px] font-medium leading-[1]">
                {review.LikeCounts || 0}
              </span>
              <button
                type="button"
                onClick={() => onLike?.(review.id)}
                className="hover:text-green-500 transition-colors flex items-center justify-center"
              >
                <ThumbsUpIcon />
              </button>
            </div>
          </div>

          <div className="flex flex-row-reverse gap-0.5">
            {[...Array(5)].map((_, i) =>
              i < review.Rate ? (
                <StarIcon key={i} className="h-3.5 w-3.5" />
              ) : (
                <EmptyStarIcon key={i} className="h-3.5 w-3.5" />
              ),
            )}
          </div>

          {isAdmin && review.Status !== "Accepted" && (
            <div className="mt-2 flex items-center gap-1">
              {onStatusUpdate && (
                <>
                  <button
                    type="button"
                    onClick={() => onStatusUpdate(review.id, "Accepted")}
                    className="rounded-lg bg-green-50 p-1 text-green-600 hover:bg-green-100"
                    title="تایید"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onStatusUpdate(review.id, "Rejected")}
                    className="rounded-lg bg-red-50 p-1 text-red-600 hover:bg-red-100"
                    title="رد"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(review.id)}
                  className="rounded-lg bg-slate-100 p-1 text-slate-600 hover:bg-slate-200"
                  title="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Content */}
      <div className="text-[14px] leading-[1.68] text-[#525252]">{review.Content}</div>

      {/* Replies */}
      {review.product_review_replies && review.product_review_replies.length > 0 && (
        <div className="mt-4 space-y-3">
          {review.product_review_replies.map((reply) => (
            <PDPCommentListItem
              key={reply.id}
              review={mapReplyToReview(reply)}
              isReply={true}
              onStatusUpdate={onStatusUpdate}
              onDelete={onDelete}
              onLike={onLike}
              onDislike={onDislike}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
