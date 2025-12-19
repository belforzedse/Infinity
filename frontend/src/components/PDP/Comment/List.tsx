"use client";

import React, { useState, useMemo } from "react";
import SortDescIcon from "@/components/PLP/Icons/SortDescIcon";
import PDPCommentListItem from "./ListItem";
import type { ProductReview } from "@/services/product/product-review.service";

type SortOption = "newest" | "oldest" | "highestRating" | "lowestRating";

type Props = {
  reviews: ProductReview[];
  onStatusUpdate?: (id: number, status: "Accepted" | "Rejected") => void;
  onDelete?: (id: number) => void;
  onLike?: (id: number) => void;
  onDislike?: (id: number) => void;
  onReply?: (id: number) => void;
};

export default function PDPCommentList({
  reviews,
  onStatusUpdate,
  onDelete,
  onLike,
  onDislike,
  onReply,
}: Props) {
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [showSortOptions, setShowSortOptions] = useState(false);

  const sortLabels = {
    newest: "جدیدترین",
    oldest: "قدیمی‌ترین",
    highestRating: "بیشترین امتیاز",
    lowestRating: "کمترین امتیاز",
  };

  const sortedReviews = useMemo(() => {
    if (!reviews?.length) return [];

    return [...reviews].sort((a, b) => {
      const dateA = new Date(a.Date || a.createdAt).getTime();
      const dateB = new Date(b.Date || b.createdAt).getTime();
      const safeDateA = Number.isNaN(dateA) ? 0 : dateA;
      const safeDateB = Number.isNaN(dateB) ? 0 : dateB;
      const rateA = Number(a.Rate) || 0;
      const rateB = Number(b.Rate) || 0;

      if (sortOption === "newest") return safeDateB - safeDateA;
      if (sortOption === "oldest") return safeDateA - safeDateB;
      if (sortOption === "highestRating") return rateB - rateA;
      if (sortOption === "lowestRating") return rateA - rateB;
      return 0;
    });
  }, [reviews, sortOption]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[30px] font-normal text-[#404040] leading-[1.238]">
          {reviews.length > 0 ? "شماهم دیدگاه خودتونو ثبت کنین" : "هنوز دیدگاهی ثبت نشده است"}
        </h3>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSortOptions(!showSortOptions)}
            className="flex items-center gap-1 rounded-[8px] bg-[#FAFAF9] px-4 py-1 text-[12px] text-[#333333] transition-all hover:bg-slate-100"
          >
            <span>{sortLabels[sortOption]}</span>
            <SortDescIcon className="h-6 w-6" />
          </button>

          {showSortOptions && (
            <div className="absolute left-0 top-full z-20 mt-2 w-48 rounded-[12px] border border-slate-100 bg-white p-2 shadow-xl">
              {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setSortOption(option as SortOption);
                    setShowSortOptions(false);
                  }}
                  className={`w-full rounded-[8px] px-4 py-2 text-right text-[12px] transition-colors hover:bg-[#FAFAF9] ${
                    sortOption === option ? "bg-pink-50 text-[#DB2777] font-medium" : "text-[#333333]"
                  }`}
                >
                  {sortLabels[option as SortOption]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {sortedReviews.length === 0 ? (
          <div className="rounded-[20px] border-2 border-dashed border-slate-100 py-20 text-center">
            <p className="text-[#A3A3A3] font-medium">اولین نفری باشید که برای این محصول نظر می‌گذارد</p>
          </div>
        ) : (
          sortedReviews.map((review) => (
            <PDPCommentListItem
              key={review.id}
              review={review}
              onStatusUpdate={onStatusUpdate}
              onDelete={onDelete}
              onLike={onLike}
              onDislike={onDislike}
              onReply={onReply}
            />
          ))
        )}
      </div>
    </div>
  );
}
