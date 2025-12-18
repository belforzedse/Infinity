import React from "react";
import BlurImage from "@/components/ui/BlurImage";
import imageLoader from "@/utils/imageLoader";
import Link from "next/link";
import GridIcon from "./Icons/GridIcon";
import MoreIcon from "./Icons/MoreIcon";
import HeartIcon from "./Icons/HeartIcon";
import clsx from "clsx";

export interface ProductSmallCardProps {
  id: number;
  slug?: string;
  title: string;
  category: string;
  likedCount: number;
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

const ProductSmallCard: React.FC<ProductSmallCardProps> = ({
  id,
  slug,
  title,
  category,
  likedCount,
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

  return (
    <Link href={productUrl} className={clsx("w-full md:w-[269px]", className)}>
      <div className="flex h-[116px] flex-row gap-2 rounded-2xl border border-slate-200 bg-white p-2 md:w-full">
        <div className="relative h-[100px] w-24">
          {discount && discount > 0 && (
            <div className="text-xs absolute left-0 top-0 z-10 rounded-br-xl rounded-tl-xl bg-rose-600 px-2 py-0.5 text-white">
              ٪{discount}
            </div>
          )}
          <BlurImage
            src={image}
            alt={title}
            fill
            className={`rounded-xl object-cover transition-all duration-300 ${
              !isAvailable ? "opacity-60 saturate-[0.4] blur-[0.5px]" : ""
            }`}
            sizes="96px"
            priority={priority}
            loader={imageLoader}
          />
          {!isAvailable && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-200/20 backdrop-blur-[1px]">
              <div className="rounded-full bg-neutral-800/70 px-2.5 py-1 shadow-md backdrop-blur-md ring-1 ring-white/10">
                <span className="text-[10px] font-bold text-white">ناموجود</span>
              </div>
            </div>
          )}
          {colorsCount && colorsCount > 0 && (
            <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded-xl bg-stone-50/90 px-1.5 py-0.5 shadow-sm backdrop-blur-sm">
              <span className="text-xs font-bold text-neutral-800">
                {colorsCount > 9 ? "9+" : colorsCount}
              </span>
              <div className="flex items-center -space-x-1.5 rtl:space-x-reverse">
                {colorCodes && colorCodes.length > 0 ? (
                  colorCodes.slice(0, 3).map((code, index) => (
                    <div
                      key={index}
                      className="relative h-4 w-4 rounded-full border border-white shadow-xs overflow-hidden"
                      style={{ backgroundColor: code, zIndex: 3 - index }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40" />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="relative h-4 w-4 rounded-full border border-white bg-gradient-to-r from-blue-600 to-blue-400 shadow-xs overflow-hidden" style={{ zIndex: 3 }}>
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40" />
                    </div>
                    <div className="relative h-4 w-4 rounded-full border border-white bg-gradient-to-r from-pink-600 to-pink-400 shadow-xs overflow-hidden" style={{ zIndex: 2 }}>
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40" />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between py-0.5">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <GridIcon className="h-4 w-4 text-neutral-400" />
              <span className="text-xs text-neutral-400">{category}</span>
            </div>
            <div className="flex items-center justify-between">
              <button>
                <MoreIcon className="h-6 w-6 text-pink-500" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <h3 className="text-xs line-clamp-1 text-neutral-800">{title}</h3>
            <div className="flex items-center gap-0.5">
              <HeartIcon className="h-2 w-2 text-pink-600" />
              <span className="text-[10px] text-pink-600">
                {likedCount} نفر این محصول را پسندیدند!
              </span>
            </div>
          </div>

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
        </div>
      </div>
    </Link>
  );
};

export default ProductSmallCard;
