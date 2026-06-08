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
    "product-card-glass-chip pressable h-6 w-6 text-white transition-opacity hover:opacity-90 touch-manipulation";

  const revealClass =
    "hidden opacity-0 md:flex md:-translate-y-2 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100";

  return (
    <div
      className="absolute left-2 top-2 z-20 flex flex-col gap-2.5"
      role="group"
      aria-label="عملیات محصول"
    >
      <button
        type="button"
        onClick={onToggleLike}
        className={`${buttonBaseClass} relative z-30 ${
          isLikeLoading ? "cursor-wait opacity-50" : "opacity-100"
        }`}
        disabled={isLikeLoading}
        aria-label={isLiked ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
        aria-pressed={isLiked}
      >
        <HeartIcon
          className={`h-4 w-4 transition-colors ${
            isLiked ? "fill-infinity-primary text-infinity-primary" : "text-white"
          }`}
          filled={isLiked}
        />
      </button>

      <button
        type="button"
        onClick={onQuickView}
        className={`${buttonBaseClass} z-20 ${revealClass}`}
        aria-label="نمایش سریع محصول"
      >
        <EyeIcon className="h-4 w-4 text-white" />
      </button>

      <button
        type="button"
        onClick={onShare}
        className={`${buttonBaseClass} z-10 ${revealClass} md:-translate-y-4 md:group-hover:translate-y-0 md:group-focus-within:translate-y-0`}
        aria-label="اشتراک‌گذاری"
      >
        <ShuffleIcon className="h-4 w-4 text-white" />
      </button>
    </div>
  );
};
