import Image from "next/image";
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
}) => {
  const { isLiked, isLoading, toggleLike } = useProductLike({
    productId: id.toString(),
  });

  return (
    <Link href={`/pdp/${id.toString()}`} className="block">
      <div className="w-[259px] md:w-full rounded-3xl border border-pink-50 bg-white p-1 transition-all hover:shadow-md flex flex-col h-full">
        <div className="relative">
          <ImageSlider images={images} title={title} />

          <div className="absolute left-1 right-1 top-1 flex justify-between items-center">
            {discount ? (
              <div className="rounded-tr-3xl rounded-bl-3xl bg-rose-600 px-3 py-1 flex items-center">
                <span className="text-xs text-white">٪{discount} تخفیف</span>
              </div>
            ) : (
              <span />
            )}
            <button
              className={`flex h-8 w-8 items-center justify-center rounded-3xl ${
                isLoading ? "opacity-50 cursor-wait" : "hover:bg-white/80"
              } bg-white/50 backdrop-blur transition-colors z-10`}
              onClick={toggleLike}
              disabled={isLoading}
              aria-label={
                isLiked ? "Remove from favorites" : "Add to favorites"
              }
            >
              <HeartIcon
                className={`h-3 w-3 ${
                  isLiked ? "text-pink-600 fill-pink-600" : "stroke-neutral-500"
                }`}
                filled={isLiked}
              />
            </button>
          </div>

          {colorsCount && colorsCount > 0 && (
            <div className="absolute bottom-2 right-2 bg-stone-50 rounded-xl px-2 py-1 flex items-center gap-0.5 shadow-md">
              <span className="text-xxs text-neutral-800">3+</span>
              <div className="relative w-4">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 absolute left-0 top-1/2 -translate-y-1/2" />
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-600 to-pink-400 absolute left-1.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}
        </div>

        <div className="px-1 py-4 flex-grow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <GridIcon className="text-neutral-400" />
              <span className="text-xs text-neutral-400">{category}</span>
            </div>
          </div>

          <h3 className="mt-0.5 text-sm md:text-base text-neutral-800 line-clamp-1">
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
              <span className="text-[9px] md:text-xs text-pink-800">
                {seenCount} نفر در ۲۴ ساعت گذشته آن را دیده‌اند!
              </span>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-stone-100 px-3 py-2 mt-auto">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500">قیمت</span>

            <div className="flex flex-col md:flex-row items-end md:items-center gap-2">
              {discountPrice && (
                <span className="text-base md:text-lg text-pink-600 whitespace-nowrap">
                  {(discountPrice || price).toLocaleString("fa-IR")} تومان
                </span>
              )}

              <span
                className={`${
                  discountPrice
                    ? "text-foreground-muted line-through text-xs"
                    : "text-neutral-700 text-base md:text-lg whitespace-nowrap"
                }`}
              >
                {price.toLocaleString("fa-IR")} تومان
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
