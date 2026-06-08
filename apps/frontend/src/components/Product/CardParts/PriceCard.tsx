import React from "react";
import { faNum } from "@/utils/faNum";

interface PriceCardProps {
  isAvailable?: boolean;
  price: number;
  discountedPrice?: number;
}

export function PriceCard({
  isAvailable = true,
  price,
  discountedPrice,
}: PriceCardProps): React.JSX.Element {
  const hasDiscount = Boolean(
    discountedPrice && discountedPrice > 0 && discountedPrice < price,
  );

  return (
    <div className="min-h-[36px] rounded-[14px] bg-stone-100 px-3 py-2">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="shrink-0 text-xs text-neutral-500">قیمت</span>

        {!isAvailable ? (
          <span className="text-xs font-medium text-red-600">ناموجود</span>
        ) : (
          <div className="flex min-w-0 items-center justify-end gap-1.5">
            <span
              className={`truncate text-xs font-medium ${
                hasDiscount ? "text-infinity-primary" : "text-neutral-800"
              }`}
            >
              {faNum(hasDiscount ? discountedPrice! : price)} تومان
            </span>

            {hasDiscount && (
              <span className="shrink-0 text-[10px] text-neutral-400 line-through">
                {faNum(price)} تومان
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
