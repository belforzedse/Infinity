import React from "react";

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
  return (
    <div className="rounded-lg bg-stone-100 px-3 py-1 md:p-1">
      <div className="flex justify-between md:justify-center">
        <div className="text-xs text-neutral-500 md:hidden">قیمت</div>

        {!isAvailable ? (
          <span className="text-xs font-medium text-red-600">ناموجود</span>
        ) : (
          <div className="flex items-center justify-end gap-1 md:justify-center">
            <span
              className={`text-xs ${
                discountedPrice && discountedPrice > 0 && discountedPrice < price
                  ? "text-pink-600"
                  : "text-neutral-800"
              } font-medium`}
            >
              {(discountedPrice && discountedPrice > 0 && discountedPrice < price
                ? discountedPrice
                : price
              )?.toLocaleString()}{" "}
              تومان
            </span>

            {discountedPrice && discountedPrice > 0 && discountedPrice < price && (
              <span className="text-[10px] text-neutral-400 line-through">
                {price?.toLocaleString()} تومان
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

