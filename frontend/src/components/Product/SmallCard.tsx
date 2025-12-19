"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import BlurImage from "@/components/ui/BlurImage";
import imageLoader from "@/utils/imageLoader";
import Link from "next/link";
import dynamic from "next/dynamic";
import GridIcon from "./Icons/GridIcon";
import MoreIcon from "./Icons/MoreIcon";
import HeartIcon from "./Icons/HeartIcon";
import EyeIcon from "./Icons/EyeIcon";
import ShuffleIcon from "@/components/PDP/Icons/ShuffleIcon";
import ColorSwatches from "./ColorSwatches";
import useProductLike from "@/hooks/useProductLike";
import { faNum } from "@/utils/faNum";
import clsx from "clsx";

// Lazy load heavy modals
const QuickViewModal = dynamic(() => import("./QuickViewModal"), {
  ssr: false,
  loading: () => null,
});

const ShareModal = dynamic(() => import("./ShareModal"), {
  ssr: false,
  loading: () => null,
});

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
  // State management
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Refs
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Hooks
  const {
    isLiked,
    isLoading: isLikeLoading,
    toggleLike,
  } = useProductLike({
    productId: id.toString(),
  });

  const hasDiscount = Boolean(
    discountedPrice && discountedPrice > 0 && discountedPrice < price,
  );

  // Use slug if available, otherwise fall back to ID for backwards compatibility
  const productUrl = slug ? `/pdp/${slug}` : `/pdp/${id}`;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Event handlers
  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsQuickViewOpen(true);
  }, []);

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsShareOpen(true);
  }, []);

  const handleToggleLike = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsMenuOpen(false);
      toggleLike(e);
    },
    [toggleLike],
  );

  return (
    <>
      <article className={clsx("relative w-full md:w-[269px]", className)}>
        <Link
          href={productUrl}
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          aria-label={`مشاهده جزئیات ${title}`}
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
              <ColorSwatches
                colorCodes={colorCodes}
                colorsCount={colorsCount}
                size="sm"
                className="absolute bottom-1 right-1"
              />
            </div>

            <div className="flex flex-1 flex-col justify-between py-0.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  <GridIcon className="h-4 w-4 text-neutral-400" />
                  <span className="text-xs text-neutral-400">{category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    ref={menuButtonRef}
                    onClick={handleMenuToggle}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    aria-label="منوی عملیات"
                    aria-expanded={isMenuOpen}
                    type="button"
                  >
                    <MoreIcon className="h-6 w-6 text-pink-500" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <h3 className="text-xs line-clamp-1 text-neutral-800">{title}</h3>
                {likedCount > 100 && (
                  <div className="flex items-center gap-0.5">
                    <HeartIcon className="h-2 w-2 text-pink-600" />
                    <span className="text-[10px] text-pink-600">
                      {faNum(likedCount)} نفر این محصول را پسندیدند!
                    </span>
                  </div>
                )}
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

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute left-2 top-12 z-50 min-w-[180px] rounded-xl bg-white p-2 shadow-lg ring-1 ring-slate-200"
            role="menu"
            aria-label="منوی عملیات محصول"
          >
            <ul className="space-y-1">
              {/* Like/Unlike */}
              <li>
                <button
                  type="button"
                  onClick={handleToggleLike}
                  disabled={isLikeLoading}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-neutral-700 transition-colors hover:bg-pink-50 hover:text-pink-600 disabled:cursor-wait disabled:opacity-50"
                  role="menuitem"
                  aria-label={isLiked ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
                >
                  <HeartIcon
                    className={clsx(
                      "h-4 w-4 transition-colors",
                      isLiked ? "fill-pink-600 text-pink-600" : "text-neutral-400",
                    )}
                    filled={isLiked}
                  />
                  <span>{isLiked ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}</span>
                </button>
              </li>

              {/* Quick View */}
              <li>
                <button
                  type="button"
                  onClick={handleQuickView}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-neutral-700 transition-colors hover:bg-pink-50 hover:text-pink-600"
                  role="menuitem"
                  aria-label="نمایش سریع"
                >
                  <EyeIcon className="h-4 w-4 text-neutral-400" />
                  <span>نمایش سریع</span>
                </button>
              </li>

              {/* Share */}
              <li>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-neutral-700 transition-colors hover:bg-pink-50 hover:text-pink-600"
                  role="menuitem"
                  aria-label="اشتراک‌گذاری"
                >
                  <ShuffleIcon className="h-4 w-4 text-neutral-400" />
                  <span>اشتراک‌گذاری</span>
                </button>
              </li>
            </ul>
          </div>
        )}
      </article>

      {/* Modals */}
      {isQuickViewOpen && (
        <QuickViewModal
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
          productId={id}
        />
      )}

      {isShareOpen && (
        <ShareModal
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          product={{
            id,
            title,
            slug,
            imageUrl: image,
            price,
            discountPrice: discountedPrice,
          }}
        />
      )}
    </>
  );
};

export default ProductSmallCard;
