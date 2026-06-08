"use client";

import { type FC } from "react";
import { faNum } from "@/utils/faNum";

interface PriceSectionProps {
  price: number;
  discountPrice?: number;
  hasDiscount: boolean;
  isAvailable: boolean;
}

export const PriceSection: FC<PriceSectionProps> = ({
  price,
  discountPrice,
  hasDiscount,
  isAvailable,
}) => {
  return (
    <div className="mt-auto flex min-h-[43px] items-center justify-center rounded-[14px] bg-stone-100 px-3 py-2 transition-all duration-300 md:mt-1 md:group-hover:rounded-[14px] md:group-hover:bg-infinity-primary md:group-focus-within:rounded-[14px] md:group-focus-within:bg-infinity-primary">
      <div className="flex w-full min-w-0 items-center justify-between md:group-hover:justify-center md:group-focus-within:justify-center">
        {!hasDiscount && isAvailable && (
          <span className="shrink-0 text-sm text-neutral-500 md:group-hover:hidden md:group-focus-within:hidden">
            قیمت
          </span>
        )}

        {!isAvailable ? (
          <span className="text-base text-red-600 md:text-base md:group-hover:text-white md:group-focus-within:text-white">
            ناموجود
          </span>
        ) : (
          <div className="flex min-w-0 flex-row flex-wrap items-center justify-start gap-2 text-left md:group-hover:justify-center md:group-hover:gap-3 md:group-focus-within:justify-center md:group-focus-within:gap-3">
            {hasDiscount && discountPrice && (
              <span className="truncate whitespace-nowrap text-base text-infinity-primary md:group-hover:text-lg md:group-hover:text-white md:group-focus-within:text-lg md:group-focus-within:text-white">
                {faNum(discountPrice)} تومان
              </span>
            )}

            <span
              className={`min-w-0 truncate ${
                hasDiscount
                  ? "text-xs text-neutral-400 line-through md:group-hover:text-sm md:group-hover:text-infinity-primary-lighter md:group-hover:no-underline md:group-focus-within:text-sm md:group-focus-within:text-infinity-primary-lighter md:group-focus-within:no-underline"
                  : "whitespace-nowrap text-base text-neutral-800 md:group-hover:text-lg md:group-hover:text-white md:group-focus-within:text-lg md:group-focus-within:text-white"
              }`}
            >
              {faNum(price)} تومان
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
