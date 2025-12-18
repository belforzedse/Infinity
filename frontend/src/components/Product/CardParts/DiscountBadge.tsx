"use client";

import { type FC } from "react";

interface DiscountBadgeProps {
  discount?: number;
}

export const DiscountBadge: FC<DiscountBadgeProps> = ({ discount }) => {
  if (!discount) return <span />;

  return (
    <div
      className="flex items-center rounded-bl-3xl rounded-tr-3xl bg-rose-600 px-3 py-1"
      role="status"
      aria-label={`${discount} درصد تخفیف`}
    >
      <span className="text-xs font-medium text-white">٪{discount} تخفیف</span>
    </div>
  );
};
