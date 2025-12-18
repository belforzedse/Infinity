"use client";

import Link from "next/link";
import { type FC, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { faNum } from "@/utils/faNum";
import useProductLike from "@/hooks/useProductLike";

// Components
import ImageSlider from "./ImageSlider";
import ColorSwatches from "./ColorSwatches";
import {
  DiscountBadge,
  VariationOverlay,
  ProductInfo,
  PriceSection,
  FloatingActions,
} from "./CardParts";

// Lazy load heavy modals
const QuickViewModal = dynamic(() => import("./QuickViewModal"), {
  ssr: false,
  loading: () => null,
});

const CompareModal = dynamic(() => import("./CompareModal"), {
  ssr: false,
  loading: () => null,
});

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
  // State
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Hooks
  const {
    isLiked,
    isLoading: isLikeLoading,
    toggleLike,
  } = useProductLike({
    productId: id.toString(),
  });

  // Memoized values
  const productUrl = useMemo(() => (slug ? `/pdp/${slug}` : `/pdp/${id.toString()}`), [slug, id]);

  const hasDiscount = useMemo(
    () => Boolean(discountPrice && discountPrice > 0 && discountPrice < price),
    [discountPrice, price],
  );

  const validImages = useMemo(
    () => images.filter((img) => img && typeof img === "string" && img.trim() !== ""),
    [images],
  );

  const variationImages = useMemo(() => validImages.slice(1, 4), [validImages]);

  const hasVariations = useMemo(
    () => isAvailable && (validImages.length > 1 || (colorsCount && colorsCount > 1)),
    [isAvailable, validImages.length, colorsCount],
  );

  const isLowStock = useMemo(
    () => isAvailable && inventoryCount && inventoryCount > 0 && inventoryCount < 5,
    [isAvailable, inventoryCount],
  );

  // Event handlers
  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  }, []);

  const handleCompare = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCompareOpen(true);
  }, []);

  const handleToggleLike = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      toggleLike(e);
    },
    [toggleLike],
  );

  return (
    <>
      <article
        className={`${isAvailable ? "group" : ""} relative w-full md:mx-auto md:w-fit`}
        aria-label={`محصول ${title}`}
      >
        <Link
          href={productUrl}
          className="block rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          aria-label={`مشاهده جزئیات ${title}`}
        >
          <div className="interactive-card pressable flex h-full w-full flex-col rounded-3xl border border-pink-50 bg-white p-1 transition-all duration-300 md:w-[258px] md:group-hover:border-pink-100 md:group-hover:shadow-lg">
            {/* Image Section */}
            <div className="relative overflow-hidden rounded-[20px] md:h-[270px] md:w-[250px]">
              <ImageSlider
                images={images}
                title={title}
                priority={priority}
                isAvailable={isAvailable}
              />

              {/* Variation Overlay - Desktop Only */}
              {hasVariations && (
                <VariationOverlay
                  variationImages={variationImages}
                  colorsCount={colorsCount}
                  validImagesCount={validImages.length}
                  colorCodes={colorCodes}
                  title={title}
                />
              )}

              {/* Badges */}
              <div className="absolute left-1 right-1 top-1 flex items-center justify-between">
                <DiscountBadge discount={discount} />
                {isLowStock && (
                  <div className="flex items-center gap-1 rounded-full bg-orange-500/90 px-2 py-1 backdrop-blur-sm">
                    <span className="text-xs font-medium text-white">
                      {faNum(inventoryCount!)} عدد
                    </span>
                  </div>
                )}
              </div>

              {/* Color Swatches - Mobile */}
              <ColorSwatches
                colorCodes={colorCodes}
                colorsCount={colorsCount}
                className="absolute bottom-2 right-2 transition-opacity duration-300 md:group-hover:opacity-0"
              />
            </div>

            {/* Product Info */}
            <ProductInfo category={category} title={title} seenCount={seenCount} />

            {/* Price Section */}
            <PriceSection
              price={price}
              discountPrice={discountPrice}
              hasDiscount={hasDiscount}
              isAvailable={isAvailable}
            />
          </div>
        </Link>

        {/* Floating Action Buttons */}
        <FloatingActions
          isLiked={isLiked}
          isLikeLoading={isLikeLoading}
          onToggleLike={handleToggleLike}
          onQuickView={handleQuickView}
          onCompare={handleCompare}
        />
      </article>

      {/* Modals */}
      {isQuickViewOpen && (
        <QuickViewModal
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
          productId={id}
        />
      )}

      {isCompareOpen && (
        <CompareModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          productId={id}
        />
      )}
    </>
  );
};

export default ProductCard;
