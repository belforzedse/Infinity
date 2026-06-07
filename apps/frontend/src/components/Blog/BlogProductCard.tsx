import React from "react";
import BlurImage from "@/components/ui/BlurImage";
import imageLoader from "@/utils/imageLoader";
import Link from "next/link";
import GridIcon from "@/components/Product/Icons/GridIcon";
import HeartIcon from "@/components/Product/Icons/HeartIcon";
import ColorSwatches from "@/components/Product/ColorSwatches";
import useProductLike from "@/hooks/useProductLike";
import clsx from "clsx";
import { faNum } from "@/utils/faNum";

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

  // Use slug if available, otherwise fall back to ID for backwards compatibility
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
        <div className="interactive-card pressable flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-white p-1 transition-all hover:border-infinity-primary-lighter/60 hover:shadow-md">
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

              {discount && discount > 0 && (
                <div className="absolute left-1 top-1 flex items-center rounded-bl-xl rounded-tr-xl bg-infinity-primary px-2 py-0.5">
                  <span className="text-xs text-white">٪{discount} تخفیف</span>
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

          <div className="flex-grow px-1 py-2">
            <div className="flex items-center gap-1">
              <GridIcon className="h-3 w-3 text-neutral-400" />
              <span className="text-[10px] text-neutral-400">{category}</span>
            </div>

            <h3 className="text-[10px] mt-0.5 line-clamp-2 text-neutral-800 leading-tight font-medium">{title}</h3>
          </div>

          <div className="mt-auto rounded-xl bg-stone-100 px-2 py-1">
            {!isAvailable ? (
              <span className="text-xs font-medium text-red-600">ناموجود</span>
            ) : (
              <div className="flex flex-col items-end gap-0.5">
                {discountedPrice && discountedPrice > 0 && discountedPrice < price && (
                  <span className="text-xs text-infinity-primary font-medium">
                    {faNum(discountedPrice)} تومان
                  </span>
                )}
                <span
                  className={`text-xs ${
                    discountedPrice && discountedPrice > 0 && discountedPrice < price
                      ? "text-neutral-400 line-through"
                      : "text-neutral-700 font-medium"
                  }`}
                >
                  {faNum(price)} تومان
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Like button outside Link for independent interaction */}
      <button
        onClick={(e) => {
          toggleLike(e);
        }}
        className={`absolute top-2 left-2 glass-chip flex h-8 w-8 items-center justify-center rounded-full ${
          isLoading ? "cursor-wait opacity-50" : "hover:brightness-[1.05]"
        } z-20 transition-all ring-1 ring-white/60`}
        disabled={isLoading}
        aria-label={isLiked ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
        aria-pressed={isLiked}
      >
        <HeartIcon
          className={`h-4 w-4 ${
            isLiked ? "fill-infinity-primary text-infinity-primary" : "stroke-neutral-500 text-neutral-500"
          }`}
          filled={isLiked}
        />
      </button>
    </div>
  );
};

export default BlogProductCard;

