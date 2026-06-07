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
    <div className="mt-auto flex items-center justify-center rounded-[24px] bg-stone-100 px-3 py-2 transition-all duration-300 md:mt-1 md:group-hover:rounded-[32px] md:group-hover:bg-infinity-primary">
      <div className="flex w-full items-center justify-between md:group-hover:justify-center">
        {!hasDiscount && isAvailable && (
          <span className="text-sm text-stone-500 md:group-hover:hidden">قیمت</span>
        )}

        {!isAvailable ? (
          <span className="text-base text-red-600 md:text-lg md:group-hover:text-white">
            ناموجود
          </span>
        ) : (
          <div className="flex flex-row flex-wrap items-center justify-start gap-3 text-left md:group-hover:justify-center md:group-hover:gap-4">
            {hasDiscount && discountPrice && (
              <span className="whitespace-nowrap text-base text-infinity-primary md:text-lg md:group-hover:text-xl md:group-hover:text-white">
                {faNum(discountPrice)} تومان
              </span>
            )}

            <span
              className={`${
                hasDiscount
                  ? "text-xs text-neutral-400 line-through md:group-hover:text-sm md:group-hover:text-infinity-primary-lighter md:group-hover:no-underline"
                  : "whitespace-nowrap text-base text-neutral-700 md:text-lg md:group-hover:text-xl md:group-hover:text-white"
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
