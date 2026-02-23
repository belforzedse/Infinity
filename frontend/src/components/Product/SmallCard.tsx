"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import imageLoader from "@/utils/imageLoader";
import Link from "next/link";
import dynamic from "next/dynamic";
import HeartIcon from "./Icons/HeartIcon";
import EyeIcon from "./Icons/EyeIcon";
import ShuffleIcon from "@/components/PDP/Icons/ShuffleIcon";
import useProductLike from "@/hooks/useProductLike";
import clsx from "clsx";
import { ImageCard, InfoCard, PriceCard } from "./CardParts";

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
  /** Optional external like state/handler for PLP-level batching. */
  isLikedOverride?: boolean;
  isLikeLoadingOverride?: boolean;
  onToggleLikeOverride?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

interface ProductSmallCardLikeState {
  isLiked: boolean;
  isLikeLoading: boolean;
  onToggleLike: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

interface ProductSmallCardViewProps extends ProductSmallCardProps {
  likeState: ProductSmallCardLikeState;
}

const ProductSmallCardView: React.FC<ProductSmallCardViewProps> = ({
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
  likeState,
}) => {
  // State management
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Refs
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Use slug if available, otherwise fall back to ID for backwards compatibility.
  const productUrl = slug ? `/pdp/${encodeURIComponent(slug)}` : `/pdp/${id}`;

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
      likeState.onToggleLike(e);
    },
    [likeState],
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
            <ImageCard
              image={image}
              title={title}
              discount={discount}
              isAvailable={isAvailable}
              priority={priority}
              imageLoader={imageLoader}
              colorCodes={colorCodes}
              colorsCount={colorsCount}
            />

            <InfoCard
              category={category}
              title={title}
              likedCount={likedCount}
              menuButtonRef={menuButtonRef}
              handleMenuToggle={handleMenuToggle}
              isMenuOpen={isMenuOpen}
            >
              <PriceCard
                isAvailable={isAvailable}
                price={price}
                discountedPrice={discountedPrice}
              />
            </InfoCard>
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
                  disabled={likeState.isLikeLoading}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-neutral-700 transition-colors hover:bg-pink-50 hover:text-pink-600 disabled:cursor-wait disabled:opacity-50"
                  role="menuitem"
                  aria-label={
                    likeState.isLiked ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"
                  }
                >
                  <HeartIcon
                    className={clsx(
                      "h-4 w-4 transition-colors",
                      likeState.isLiked ? "fill-pink-600 text-pink-600" : "text-neutral-400",
                    )}
                    filled={likeState.isLiked}
                  />
                  <span>
                    {likeState.isLiked ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
                  </span>
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

const ProductSmallCardWithLocalLike: React.FC<ProductSmallCardProps> = (props) => {
  const { id } = props;
  const { isLiked, isLoading: isLikeLoading, toggleLike } = useProductLike({
    productId: id.toString(),
  });

  const likeState = useMemo<ProductSmallCardLikeState>(
    () => ({
      isLiked,
      isLikeLoading,
      onToggleLike: toggleLike,
    }),
    [isLiked, isLikeLoading, toggleLike],
  );

  return <ProductSmallCardView {...props} likeState={likeState} />;
};

const ProductSmallCard: React.FC<ProductSmallCardProps> = (props) => {
  const { isLikedOverride, isLikeLoadingOverride, onToggleLikeOverride } = props;

  if (onToggleLikeOverride) {
    return (
      <ProductSmallCardView
        {...props}
        likeState={{
          isLiked: Boolean(isLikedOverride),
          isLikeLoading: Boolean(isLikeLoadingOverride),
          onToggleLike: onToggleLikeOverride,
        }}
      />
    );
  }

  return <ProductSmallCardWithLocalLike {...props} />;
};

export default ProductSmallCard;
