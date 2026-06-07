"use client";

import { type FC } from "react";
import GridIcon from "../Icons/GridIcon";

interface ProductInfoProps {
  category: string;
  title: string;
  /** Kept for API compatibility; view count is intentionally not displayed to customers. */
  seenCount?: number;
}

export const ProductInfo: FC<ProductInfoProps> = ({ category, title }) => {
  return (
    <div className="flex-grow px-1 py-2 md:py-3">
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-1">
          <span className="text-xs text-neutral-400">{category}</span>
          <GridIcon className="text-neutral-400" />
        </div>
      </div>

      <h3 className="mt-0.5 line-clamp-1 text-sm text-neutral-800 md:text-base">
        {title}
      </h3>
    </div>
  );
};
