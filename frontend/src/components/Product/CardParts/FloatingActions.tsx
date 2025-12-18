"use client";

import { type FC } from "react";
import HeartIcon from "../Icons/HeartIcon";
import EyeIcon from "../Icons/EyeIcon";
import ShuffleIcon from "../../PDP/Icons/ShuffleIcon";

interface FloatingActionsProps {
  isLiked: boolean;
  isLikeLoading: boolean;
  onToggleLike: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onQuickView: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onShare: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const FloatingActions: FC<FloatingActionsProps> = ({
  isLiked,
  isLikeLoading,
  onToggleLike,
  onQuickView,
  onShare,
}) => {
  const buttonBaseClass =
    "glass-chip flex h-11 w-11 md:h-8 md:w-8 items-center justify-center rounded-full ring-1 ring-white/60 transition-all hover:scale-110 hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] shadow-[0_0_10px_rgba(236,72,153,0.15)] touch-manipulation";

  return (
    <div
      className="absolute left-2.5 top-2.5 z-20 flex flex-col gap-2"
      role="group"
      aria-label="عملیات محصول"
    >
      {/* Like Button */}
      <button
        onClick={onToggleLike}
        className={`${buttonBaseClass} relative z-30 ${
          isLikeLoading ? "cursor-wait opacity-50" : "opacity-100"
        }`}
        disabled={isLikeLoading}
        aria-label={isLiked ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
        aria-pressed={isLiked}
      >
        <HeartIcon
          className={`h-5 w-5 transition-colors md:h-4 md:w-4 ${
            isLiked ? "fill-pink-600 text-pink-600" : "text-neutral-500"
          }`}
          filled={isLiked}
        />
      </button>

      {/* Quick View Button */}
      <button
        onClick={onQuickView}
        className={`${buttonBaseClass} z-20 opacity-100 md:-translate-y-10 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100`}
        aria-label="نمایش سریع محصول"
      >
        <EyeIcon className="h-5 w-5 text-neutral-500 md:h-4 md:w-4" />
      </button>

      {/* Share Button */}
      <button
        onClick={onShare}
        className={`${buttonBaseClass} z-10 opacity-100 md:-translate-y-20 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100`}
        aria-label="اشتراک‌گذاری"
      >
        <ShuffleIcon className="h-5 w-5 text-neutral-500 md:h-4 md:w-4" />
      </button>
    </div>
  );
};
