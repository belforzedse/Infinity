import React from "react";
import BlurImage from "@/components/ui/BlurImage";
import imageLoader from "@/utils/imageLoader";
import Link from "next/link";
import GridIcon from "@/components/Product/Icons/GridIcon";
import HeartIcon from "@/components/Product/Icons/HeartIcon";
import ColorSwatches from "@/components/Product/ColorSwatches";
import { DiscountBadge } from "@/components/Product/CardParts/DiscountBadge";
import useProductLike from "@/hooks/useProductLike";
import clsx from "clsx";
import { faNum } from "@/utils/faNum";
import { computeSaleDiscountPercent } from "@/utils/discounts";

export interface BlogProductCardProps {
  id: number;
  slug?: string;
  title: string;
  category: string;
  price: number;
  discountedPrice?: number;
  discount?: number;
  image: string;
  className?: string;
  isAvailable?: boolean;
  priority?: boolean;
  colorsCount?: number;
  colorCodes?: string[];
}

const BlogProductCard: React.FC<BlogProductCardProps> = ({
  id,
  slug,
  title,
  category,
  price,
  discountedPrice,
  discount,
  image,
  className,
  isAvailable = true,
  priority = false,
  colorsCount,
  colorCodes,
}) => {
  const hasDiscount = Boolean(
    discountedPrice && discountedPrice > 0 && discountedPrice < price,
  );

  const saleDiscountPercent = computeSaleDiscountPercent(price, discountedPrice, discount);

  const productUrl = slug ? `/pdp/${slug}` : `/pdp/${id}`;

  const { isLiked, isLoading, toggleLike } = useProductLike({
    productId: id.toString(),
  });

  return (
    <div className={clsx("group relative w-[168px] flex-shrink-0", className)}>
      <Link
        href={productUrl}
        className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary focus-visible:ring-offset-2"
      >
        <div className="interactive-card pressable flex h-full w-full flex-col gap-1 rounded-2xl border border-slate-100 bg-white p-1 transition-all hover:border-infinity-primary-lighter/60">
          <div className="relative">
            <div className="relative mx-auto h-[140px] w-[152px] overflow-hidden rounded-xl">
              <BlurImage
                src={image}
                alt={title}
                fill
                className={`object-cover transition-all duration-300 ${
                  !isAvailable ? "opacity-60 saturate-[0.4] blur-[0.5px]" : ""
                }`}
                sizes="152px"
                priority={priority}
                loader={imageLoader}
              />

              {!isAvailable && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-200/20 backdrop-blur-[1px]">
                  <div className="rounded-full bg-neutral-800/70 px-3 py-1 shadow-md backdrop-blur-md ring-1 ring-white/10">
                    <span className="text-[10px] font-bold text-white">ناموجود</span>
                  </div>
                </div>
              )}

              {saleDiscountPercent !== undefined && (
                <div className="absolute right-1 top-1 z-10">
                  <DiscountBadge discount={saleDiscountPercent} />
                </div>
              )}

              <ColorSwatches
                colorCodes={colorCodes}
                colorsCount={colorsCount}
                size="sm"
                className="absolute bottom-2 right-2"
              />
            </div>
          </div>

          <div className="flex-grow px-1 py-1">
            <div className="flex items-center justify-end gap-1">
              <span className="text-xs text-neutral-400">{category}</span>
              <GridIcon className="h-3 w-3 text-neutral-400" />
            </div>

            <h3 className="mt-0.5 line-clamp-2 text-base leading-tight text-neutral-800">
              {title}
            </h3>
          </div>

          <div className="mt-auto min-h-[43px] rounded-[14px] bg-stone-100 px-3 py-2">
            {!isAvailable ? (
              <span className="text-sm font-medium text-red-600">ناموجود</span>
            ) : (
              <div className="flex min-w-0 items-center justify-between gap-2">
                {!hasDiscount && <span className="shrink-0 text-sm text-neutral-500">قیمت</span>}
                <div className="flex min-w-0 flex-col items-end gap-0.5">
                  {hasDiscount && discountedPrice && (
                    <span className="truncate text-base font-medium text-infinity-primary">
                      {faNum(discountedPrice)} تومان
                    </span>
                  )}
                  <span
                    className={`truncate text-sm ${
                      hasDiscount
                        ? "text-neutral-400 line-through"
                        : "font-medium text-neutral-800"
                    }`}
                  >
                    {faNum(price)} تومان
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>

      <button
        onClick={(e) => {
          toggleLike(e);
        }}
        className={`product-card-glass-chip absolute left-2 top-2 z-20 h-6 w-6 text-white transition-opacity ${
          isLoading ? "cursor-wait opacity-50" : "hover:opacity-90"
        }`}
        disabled={isLoading}
        aria-label={isLiked ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
        aria-pressed={isLiked}
      >
        <HeartIcon
          className={`h-4 w-4 ${
            isLiked ? "fill-infinity-primary text-infinity-primary" : "text-white"
          }`}
          filled={isLiked}
        />
      </button>
    </div>
  );
};

export default BlogProductCard;
