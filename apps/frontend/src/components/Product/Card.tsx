"use client";

import Link from "next/link";
import { type FC, useState, useMemo, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import useProductLike from "@/hooks/useProductLike";
import { getLazySecondaryMediaByProductId } from "@/services/product/product";

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

const ShareModal = dynamic(() => import("./ShareModal"), {
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
}) => {
  // State
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [enrichedImages, setEnrichedImages] = useState(images);
  const hasRequestedLazyMedia = useRef(false);

  // Hooks
  const {
    isLiked,
    isLoading: isLikeLoading,
    toggleLike,
  } = useProductLike({
    productId: id.toString(),
  });

  // Memoized values
  const imageSignature = useMemo(() => images.join("|"), [images]);

  useEffect(() => {
    setEnrichedImages(images);
    hasRequestedLazyMedia.current = false;
  }, [id, imageSignature]);

  const productUrl = useMemo(() => (slug ? `/pdp/${slug}` : `/pdp/${id.toString()}`), [slug, id]);

  const hasDiscount = useMemo(
    () => Boolean(discountPrice && discountPrice > 0 && discountPrice < price),
    [discountPrice, price],
  );

  const validImages = useMemo(
    () => enrichedImages.filter((img) => img && typeof img === "string" && img.trim() !== ""),
    [enrichedImages],
  );

  const variationImages = useMemo(() => validImages.slice(1, 4), [validImages]);

  const hasVariations = useMemo(
    () => isAvailable && (validImages.length > 1 || (colorsCount && colorsCount > 1)),
    [isAvailable, validImages.length, colorsCount],
  );

  // Event handlers
  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  }, []);

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsShareOpen(true);
  }, []);

  const handleToggleLike = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      toggleLike(e);
    },
    [toggleLike],
  );

  const maybeLoadSecondaryMedia = useCallback(async () => {
    if (!isAvailable) return;
    if (hasRequestedLazyMedia.current) return;
    if (!Number.isInteger(id) || id <= 0) return;
    if (validImages.length > 1) return;

    hasRequestedLazyMedia.current = true;

    try {
      const secondaryImages = await getLazySecondaryMediaByProductId(id, 3);
      if (!secondaryImages.length) return;

      setEnrichedImages((currentImages) =>
        Array.from(
          new Set(
            [...currentImages, ...secondaryImages].filter(
              (img) => img && typeof img === "string" && img.trim() !== "",
            ),
          ),
        ),
      );
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[ProductCard] Secondary media fetch failed", {
          productId: id,
          error,
        });
      }
    }
  }, [id, isAvailable, validImages.length]);

  const handleInteractionIntent = useCallback(() => {
    void maybeLoadSecondaryMedia();
  }, [maybeLoadSecondaryMedia]);

  return (
    <>
      <article
        className={`${isAvailable ? "group" : ""} relative w-full min-w-0`}
        aria-label={`محصول ${title}`}
        onMouseEnter={handleInteractionIntent}
        onFocusCapture={handleInteractionIntent}
        onTouchStart={handleInteractionIntent}
      >
        <Link
          href={productUrl}
          className="block rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          aria-label={`مشاهده جزئیات ${title}`}
        >
          <div className="interactive-card pressable flex h-full w-full min-w-0 flex-col rounded-3xl border border-zinc-100 bg-white p-1 shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition-all duration-300 md:group-hover:border-pink-100 md:group-hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
            {/* Image Section */}
            <div className="relative aspect-[250/270] w-full min-w-0 overflow-hidden rounded-[20px]">
              <ImageSlider
                images={enrichedImages}
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
              </div>

              {/* Color Swatches - Mobile */}
              <ColorSwatches
                colorCodes={colorCodes}
                colorsCount={colorsCount}
                size="sm"
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
          onShare={handleShare}
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

      {isShareOpen && (
        <ShareModal
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          product={{
            id,
            title,
            slug,
            imageUrl: enrichedImages.find(
              (img) => img && typeof img === "string" && img.trim() !== "",
            ),
            price,
            discountPrice,
          }}
        />
      )}
    </>
  );
};

export default ProductCard;
