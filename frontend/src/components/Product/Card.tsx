import Image from "next/image";
import { faNum } from "@/utils/faNum";
import type { FC } from "react";
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

  // Debug: Log product card data
  if (process.env.NODE_ENV !== "production") {
    console.log(`ProductCard ${id} pricing:`, {
      price,
      discountPrice,
      discount,
      title: title.substring(0, 30),
      hasDiscountLogic: !!(discountPrice && discountPrice > 0),
    });
  }

  // Temporary test: Force discount for testing (REMOVE AFTER TESTING)
  // const testDiscountPrice = id === 1 ? Math.floor(price * 0.8) : discountPrice;
  // const testDiscount = id === 1 ? 20 : discount;

  return (
    <Link
      href={`/pdp/${id.toString()}`}
      className="group block rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
    >
      <div className="interactive-card pressable flex h-full w-full flex-col rounded-3xl border border-pink-50 bg-white p-1">
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
              className={`glass-chip mt-[0.5px] flex h-11 w-11 items-center justify-center rounded-full ${
                isLoading ? "cursor-wait opacity-50" : "hover:brightness-[1.05]"
              } z-10 transition-all ring-1 ring-white/60`}
              onClick={toggleLike}
              disabled={isLoading}
              aria-label={isLiked ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
              aria-pressed={isLiked}
            >
              <HeartIcon
                className={`h-5 w-5 ${
                  isLiked ? "fill-pink-600 text-pink-600" : "stroke-neutral-500 text-neutral-500"
                }`}
                filled={isLiked}
              />
            </button>
          </div>

          {colorsCount && colorsCount > 0 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-xl bg-stone-50 px-2 py-1 shadow-md">
              <span className="text-xs text-neutral-800">{colorsCount > 3 ? `${colorsCount}+` : colorsCount}‌</span>
              <div className="relative w-4">
                <div className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-600 to-blue-400" />
                <div className="absolute left-1.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-pink-600 to-pink-400" />
              </div>
            </div>
          )}
        </div>

        <div className="flex-grow px-1 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <GridIcon className="text-neutral-400" />
              <span className="text-xs text-neutral-400">{category}</span>
            </div>
          </div>

          <h3 className="text-sm mt-0.5 line-clamp-1 text-neutral-800 md:text-base">{title}</h3>

          {seenCount > 0 && (
            <div className="mt-1 flex items-center gap-0.5">
              <Image
                src="/images/eyes-emoji.png"
                alt="نمایش‌ها"
                width={8}
                height={8}
                className="h-2 w-2"
              />
              <span className="text-xs text-pink-800 md:text-sm">
                {seenCount} نفر در ۲۴ ساعت گذشته آن را دیده‌اند!
              </span>
            </div>
          )}
        </div>

        <div className="mt-auto rounded-2xl bg-stone-100 px-3 py-1.5 md:py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500">قیمت</span>

            {!isAvailable ? (
              <span className="text-base font-medium text-red-600 md:text-lg">ناموجود</span>
            ) : (
              <div className="flex flex-col items-end gap-2 md:flex-row md:items-center">
                {discountPrice && discountPrice > 0 && discountPrice < price && (
                  <span className="text-base whitespace-nowrap text-pink-600 md:text-lg">
                    {faNum(discountPrice)} تومان
                  </span>
                )}

                <span
                  className={`${
                    discountPrice && discountPrice > 0 && discountPrice < price
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
