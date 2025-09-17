import Image from "next/image";
import { faNum } from "@/utils/faNum";
import { FC } from "react";
import HeartIcon from "./Icons/HeartIcon";
import GridIcon from "./Icons/GridIcon";
import Link from "next/link";
import ImageSlider from "./ImageSlider";
import useProductLike from "@/hooks/useProductLike";

export interface ProductCardProps {
  images: string[];
  category: string;
  title: string;
  price: number;
  id: number;
  seenCount: number;
  discount?: number;
  discountPrice?: number;
  colorsCount?: number;
  isAvailable?: boolean;
  priority?: boolean;
}

const ProductCard: FC<ProductCardProps> = ({
  images,
  category,
  title,
  price,
  id,
  seenCount,
  discount,
  discountPrice,
  colorsCount,
  isAvailable = true,
  priority = false,
}) => {
  const { isLiked, isLoading, toggleLike } = useProductLike({
    productId: id.toString(),
  });

  return (
    <Link
      href={`/pdp/${id.toString()}`}
      className="group block rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
    >
      <div className="interactive-card pressable flex h-full w-[259px] flex-col rounded-3xl border border-pink-50 bg-white p-1 md:w-full">
        <div className="relative">
          <ImageSlider images={images} title={title} priority={priority} />

          <div className="absolute left-1 right-1 top-1 flex items-center justify-between">
            {discount ? (
              <div className="flex items-center rounded-bl-3xl rounded-tr-3xl bg-rose-600 px-3 py-1">
                <span className="text-xs text-white">٪{discount} تخفیف</span>
              </div>
            ) : (
              <span />
            )}
            <button
              className={`flex h-8 w-8 items-center justify-center rounded-3xl ${
                isLoading ? "cursor-wait opacity-50" : "hover:bg-white/80"
              } z-10 bg-white/50 backdrop-blur transition-colors`}
              onClick={toggleLike}
              disabled={isLoading}
              aria-label={
                isLiked ? "Remove from favorites" : "Add to favorites"
              }
            >
              <HeartIcon
                className={`h-3 w-3 ${
                  isLiked ? "fill-pink-600 text-pink-600" : "stroke-neutral-500"
                }`}
                filled={isLiked}
              />
            </button>
          </div>

          {colorsCount && colorsCount > 0 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-xl bg-stone-50 px-2 py-1 shadow-md">
              <span className="text-xxs text-neutral-800">3+</span>
              <div className="relative w-4">
                <div className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-600 to-blue-400" />
                <div className="absolute left-1.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-pink-600 to-pink-400" />
              </div>
            </div>
          )}
        </div>

        <div className="flex-grow px-1 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <GridIcon className="text-neutral-400" />
              <span className="text-xs text-neutral-400">{category}</span>
            </div>
          </div>

          <h3 className="text-sm mt-0.5 line-clamp-1 text-neutral-800 md:text-base">
            {title}
          </h3>

          {seenCount > 0 && (
            <div className="mt-1 flex items-center gap-0.5">
              <Image
                src="/images/eyes-emoji.png"
                alt="views"
                width={8}
                height={8}
                className="h-2 w-2"
              />
              <span className="text-[9px] text-pink-800 md:text-xs">
                {seenCount} نفر در ۲۴ ساعت گذشته آن را دیده‌اند!
              </span>
            </div>
          )}
        </div>

        <div className="mt-auto rounded-2xl bg-stone-100 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500">قیمت</span>

            {!isAvailable ? (
              <span className="text-base font-medium text-red-600 md:text-lg">
                ناموجود
              </span>
            ) : (
              <div className="flex flex-col items-end gap-2 md:flex-row md:items-center">
                {discountPrice && (
                  <span className="text-base whitespace-nowrap text-pink-600 md:text-lg">
                    {faNum(discountPrice || price)} تومان
                  </span>
                )}

                <span
                  className={`${
                    discountPrice
                      ? "text-xs text-foreground-muted line-through"
                      : "text-base whitespace-nowrap text-neutral-700 md:text-lg"
                  }`}
                >
                  {faNum(price)} تومان
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
