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
    <div className={`${isAvailable ? "group" : ""} relative mx-auto w-fit`}>
      <Link
        href={productUrl}
        className="block rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <div className="interactive-card pressable flex w-[258px] flex-col rounded-3xl border border-pink-50 bg-white p-1 transition-all duration-300 group-hover:border-pink-100 group-hover:shadow-lg">
          <div className="relative h-[270px] w-[250px] overflow-hidden rounded-[20px]">
            <ImageSlider
              images={images}
              title={title}
              priority={priority}
              isAvailable={isAvailable}
            />

            {/* Hover Variation Overlay */}
            {isAvailable && (validImages.length > 1 || (colorsCount && colorsCount > 1)) && (
              <div className="absolute inset-x-0 -bottom-4 z-10 translate-y-full bg-white px-3 py-4 transition-transform duration-500 ease-out group-hover:translate-y-0">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-pink-600">
                    موجود در {faNum(colorsCount || validImages.length)} رنگ بندی متفاوت!
                  </span>
                  <ColorSwatches
                    colorCodes={colorCodes}
                    colorsCount={colorsCount}
                    maxVisible={2}
                    size="sm"
                    className="!bg-transparent !p-0 !shadow-none"
                  />
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

          <div className="px-1 py-2 md:py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400"></span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-neutral-400">{category}</span>
                <GridIcon className="text-neutral-400" />
              </div>
            </div>

            <h3 className="mt-0.5 line-clamp-1 text-sm text-neutral-800 md:text-base">{title}</h3>

            {seenCount > 0 && (
              <div className="relative mt-1.5 h-6 overflow-hidden">
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
              </div>
            )}
          </div>

          <div className="mt-1 flex items-center justify-center rounded-[24px] bg-stone-100 px-3 py-2 transition-all duration-300 group-hover:rounded-[32px] group-hover:bg-pink-500">
            <div className="flex w-full items-center justify-between group-hover:justify-center">
              {!hasDiscount && (
                <span className="text-sm text-stone-500 group-hover:hidden">قیمت</span>
              )}

              {!isAvailable ? (
                <span className="text-base font-medium text-red-600 group-hover:text-white md:text-lg">
                  ناموجود
                </span>
              ) : (
                <div className="flex flex-row flex-wrap items-center justify-start gap-3 text-left group-hover:justify-center group-hover:gap-4">
                  {hasDiscount && (
                    <span className="whitespace-nowrap text-base text-pink-600 group-hover:text-xl group-hover:text-white md:text-lg">
                      {faNum(discountPrice!)} تومان
                    </span>
                  )}

                  <span
                    className={`${
                      hasDiscount
                        ? "text-foreground-muted text-xs line-through group-hover:text-sm group-hover:text-pink-100 group-hover:no-underline"
                        : "whitespace-nowrap text-base text-neutral-700 group-hover:text-xl group-hover:text-white md:text-lg"
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
      <div className="absolute left-2.5 top-2.5 z-20 flex flex-col gap-2">
        <button
          onClick={(e) => {
            toggleLike(e);
          }}
          className={`glass-chip relative z-30 flex h-8 w-8 items-center justify-center rounded-full shadow-[0_0_10px_rgba(236,72,153,0.15)] ring-1 ring-white/60 transition-all hover:scale-110 hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] ${
            isLoading ? "cursor-wait opacity-50" : "opacity-100"
          }`}
          disabled={isLoading}
          aria-label={isLiked ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
        >
          <HeartIcon
            className={`h-4 w-4 ${isLiked ? "fill-pink-600 text-pink-600" : "text-neutral-500"}`}
            filled={isLiked}
          />
        </button>

        <button className="glass-chip z-20 flex h-8 w-8 items-center justify-center rounded-full opacity-0 ring-1 ring-white/60 transition-all duration-300 -translate-y-10 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-110 hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]">
          <EyeIcon className="h-4 w-4 text-neutral-500" />
        </button>

        <button className="glass-chip z-10 flex h-8 w-8 items-center justify-center rounded-full opacity-0 ring-1 ring-white/60 transition-all duration-500 -translate-y-20 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-110 hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]">
          <ShuffleIcon className="h-4 w-4 text-neutral-500" />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
