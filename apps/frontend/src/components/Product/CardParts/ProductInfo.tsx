"use client";

import Image from "next/image";
import { type FC } from "react";
import { faNum } from "@/utils/faNum";
import GridIcon from "../Icons/GridIcon";

interface ProductInfoProps {
  category: string;
  title: string;
  seenCount: number;
}

export const ProductInfo: FC<ProductInfoProps> = ({ category, title, seenCount }) => {
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

      {seenCount > 100 && (
        <div className="relative mt-1.5 h-6 overflow-hidden">
          <div className="flex items-center gap-0.5 transition-all duration-300 md:group-hover:-translate-y-full">
            <Image
              src="/images/eyes-emoji.png"
              alt=""
              width={8}
              height={8}
              className="h-2 w-2"
              aria-hidden="true"
            />
            <span className="text-xs text-pink-800 md:text-sm">
              {faNum(seenCount)} نفر در ۲۴ ساعت گذشته آن را دیده‌اند!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
