import Image from "next/image";
import { faNum } from "@/utils/faNum";
import type { FC } from "react";
import HeartIcon from "./Icons/HeartIcon";
import GridIcon from "./Icons/GridIcon";
import Link from "next/link";
import ImageSlider from "./ImageSlider";
import ColorSwatches from "./ColorSwatches";
import useProductLike from "@/hooks/useProductLike";
import ShoppingCartIcon from "../PLP/Icons/ShoppingCartIcon";
import EyeIcon from "./Icons/EyeIcon";
import ShuffleIcon from "../PDP/Icons/ShuffleIcon";
import imageLoader from "@/utils/imageLoader";

export interface ProductCardProps {
  images: string[];
  category: string;
  title: string;
  price: number;
  id: number;
  slug?: string;
  seenCount: number;
  discount?: number;
  discountPrice?: number;
  colorsCount?: number;
  colorCodes?: string[];
  isAvailable?: boolean;
  priority?: boolean;
  productCode?: string;
  inventoryCount?: number;
}

const ProductCard: FC<ProductCardProps> = ({
  images,
  category,
  title,
  price,
  id,
  slug,
  seenCount,
  discount,
  discountPrice,
  colorsCount,
  colorCodes,
  isAvailable = true,
  priority = false,
  inventoryCount,
}) => {
  // Use slug if available, otherwise fall back to ID for backwards compatibility
  const productUrl = slug ? `/pdp/${slug}` : `/pdp/${id.toString()}`;
  const hasDiscount = Boolean(discountPrice && discountPrice > 0 && discountPrice < price);
  const { isLiked, isLoading, toggleLike } = useProductLike({
    productId: id.toString(),
  });

  const validImages = images.filter((img) => img && typeof img === "string" && img.trim() !== "");
  const variationImages = validImages.slice(1, 4);

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
    <div className="group relative">
      <Link
        href={productUrl}
        className="block rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <div className="interactive-card pressable flex h-full w-full flex-col rounded-3xl border border-pink-50 bg-white p-1 transition-all duration-300 group-hover:shadow-lg group-hover:border-pink-100">
          <div className="relative overflow-hidden rounded-[20px]">
            <ImageSlider
              images={images}
              title={title}
              priority={priority}
              isAvailable={isAvailable}
            />

            {/* Hover Variation Overlay */}
            {(validImages.length > 1 || (colorsCount && colorsCount > 1)) && (
              <div className="absolute inset-x-0 bottom-0 z-10 translate-y-full bg-white px-3 py-3.5 transition-transform duration-500 ease-out group-hover:translate-y-0">
                <div className="mb-3 flex items-center justify-between">
                  <ColorSwatches
                    colorCodes={colorCodes}
                    colorsCount={colorsCount}
                    maxVisible={2}
                    size="sm"
                    className="!bg-transparent !p-0 !shadow-none"
                  />
                  <span className="text-[10px] font-medium text-pink-600">
                    موجود در {faNum(colorsCount || validImages.length)} رنگ بندی متفاوت!
                  </span>
                </div>

                {variationImages.length > 0 && (
                  <div className="mt-3 flex h-20 gap-2">
                    {variationImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative flex-1 overflow-hidden rounded-[14px] border border-neutral-100 shadow-sm transition-transform hover:scale-[1.05]"
                      >
                        <Image
                          src={img}
                          alt={`variation-${idx}`}
                          fill
                          className="object-cover"
                          loader={imageLoader}
                          sizes="(max-width: 768px) 33vw, 100px"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="absolute left-1 right-1 top-1 flex items-center justify-between">
              {discount ? (
                <div className="flex items-center rounded-bl-3xl rounded-tr-3xl bg-rose-600 px-3 py-1">
                  <span className="text-xs text-white">٪{discount} تخفیف</span>
                </div>
              ) : (
                <span />
              )}
            </div>

            <ColorSwatches
              colorCodes={colorCodes}
              colorsCount={colorsCount}
              className="absolute bottom-2 right-2 transition-opacity duration-300 group-hover:opacity-0"
            />
        </div>

        <div className="flex-grow px-1 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400"></span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-neutral-400">{category}</span>
              <GridIcon className="text-neutral-400" />
            </div>
          </div>

          <h3 className="mt-0.5 line-clamp-1 text-sm text-neutral-800 md:text-base">{title}</h3>

          <div className="relative mt-2 h-6 overflow-hidden">
            {seenCount > 0 && (
              <div className="flex items-center gap-0.5 transition-all duration-300 group-hover:-translate-y-full">
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

            {/* Hover Inventory Status */}
            <div className={`absolute left-0 top-0 right-0 flex items-center gap-1 transition-all duration-300 ${seenCount > 0 ? "translate-y-full group-hover:translate-y-0" : "opacity-0 group-hover:opacity-100"} justify-start`}>
              <ShoppingCartIcon className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium text-red-600">
                تنها {faNum(inventoryCount || 2)} عدد در انبار موجود است!
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-center rounded-[24px] bg-stone-100 px-3 py-2 transition-all duration-300  group-hover:rounded-[32px] group-hover:bg-pink-500">
          <div className="flex w-full items-center justify-between group-hover:justify-center">
            {!hasDiscount && (
              <span className="text-sm text-stone-500 group-hover:hidden">قیمت</span>
            )}

            {!isAvailable ? (
              <span className="text-base font-medium text-red-600 md:text-lg group-hover:text-white">
                ناموجود
              </span>
            ) : (
              <div className="flex flex-row flex-wrap items-center justify-start gap-3 text-left group-hover:gap-4 group-hover:justify-center">
                {hasDiscount && (
                  <span className="whitespace-nowrap text-base text-pink-600 md:text-lg group-hover:text-xl group-hover:text-white">
                    {faNum(discountPrice!)} تومان
                  </span>
                )}

                <span
                  className={`${
                    hasDiscount
                      ? "text-xs text-foreground-muted line-through group-hover:no-underline group-hover:text-sm group-hover:text-pink-100"
                      : "whitespace-nowrap text-base text-neutral-700 md:text-lg group-hover:text-xl group-hover:text-white"
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

    {/* Floating Action Buttons */}
    <div className="absolute left-3 top-3 z-20 flex flex-col gap-2.5">
      <button
        onClick={(e) => {
          toggleLike(e);
        }}
        className={`glass-chip flex h-11 w-11 items-center justify-center rounded-full transition-all ring-1 ring-white/60 hover:scale-110 shadow-[0_0_15px_rgba(236,72,153,0.2)] hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] ${
          isLoading ? "cursor-wait opacity-50" : "opacity-100"
        }`}
        disabled={isLoading}
        aria-label={isLiked ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      >
        <HeartIcon
          className={`h-5 w-5 ${
            isLiked ? "fill-pink-600 text-pink-600" : "text-neutral-500"
          }`}
          filled={isLiked}
        />
      </button>

      <button className="glass-chip flex h-11 w-11 items-center justify-center rounded-full opacity-0 transition-all duration-300 ring-1 ring-white/60 hover:scale-110 hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] group-hover:opacity-100">
        <EyeIcon className="h-5 w-5 text-neutral-500" />
      </button>

      <button className="glass-chip flex h-11 w-11 items-center justify-center rounded-full opacity-0 transition-all duration-300 ring-1 ring-white/60 hover:scale-110 hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] group-hover:opacity-100">
        <ShuffleIcon className="h-5 w-5 text-neutral-500" />
      </button>
    </div>
    </div>
  );
};

export default ProductCard;
