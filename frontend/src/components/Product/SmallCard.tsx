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
}

const ProductSmallCard: React.FC<ProductSmallCardProps> = ({
  id,
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
}) => {
  return (
    <Link
      href={`/pdp/${id}`}
      className={clsx("w-full md:w-[269px]", className)}
    >
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
            className="rounded-xl object-cover"
            sizes="96px"
            priority={priority}
            loader={imageLoader}
          />
          <div className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded-xl bg-stone-50 px-2 py-1 shadow-sm">
            <span className="text-xxs text-neutral-800">3+</span>
            <div className="relative w-4">
              <div className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-600 to-blue-400" />
              <div className="absolute left-1.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-pink-600 to-pink-400" />
            </div>
          </div>
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
                <span className="text-xs font-medium text-red-600">
                  ناموجود
                </span>
              ) : (
                <div className="flex items-center justify-end gap-1 md:justify-center">
                  <span
                    className={`text-xs ${
                      discountedPrice && discountedPrice > 0 && discountedPrice < price ? "text-pink-600" : "text-neutral-800"
                    } font-medium`}
                  >
                    {(discountedPrice && discountedPrice > 0 && discountedPrice < price ? discountedPrice : price)?.toLocaleString()} تومان
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
