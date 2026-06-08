"use client";

import { type FC } from "react";
import { faNum } from "@/utils/faNum";

interface DiscountBadgeProps {
  discount?: number;
}

export const DiscountBadge: FC<DiscountBadgeProps> = ({ discount }) => {
  if (!discount || discount <= 0) return null;

  return (
    <div
      className="inline-flex w-fit shrink-0 items-center rounded-lg bg-rose-700 px-2 py-0.5"
      role="status"
      aria-label={`${faNum(discount)} درصد تخفیف`}
    >
      <span className="text-xs font-medium text-white">
        {faNum(discount)}٪ تخفیف
      </span>
    </div>
  );
};
