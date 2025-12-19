"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ProductDetail } from "@/services/product/product";
import { faNum } from "@/utils/faNum";
import { resolveAssetUrl } from "@/utils/resolveAssetUrl";
import { computeDiscountForVariation } from "@/utils/discounts";
import imageLoader from "@/utils/imageLoader";
import DOMPurify from "isomorphic-dompurify";

import QuickViewGallery from "./QuickViewGallery";
import QuickViewVariationSelector from "./QuickViewVariationSelector";
import QuickViewPricing from "./QuickViewPricing";

interface QuickViewContentProps {
  productData: ProductDetail;
  productId: number;
  onViewFullDetails: () => void;
  onClose: () => void;
}

type VariationUI = {
  id: number;
  price: number;
  discountPrice?: number | null;
  stock: number;
  color: { title: string; colorCode: string } | null;
  size: { title: string } | null;
};

export default function QuickViewContent({
  productData,
  productId: _productId, // keep prop shape, avoid unused lint
  onViewFullDetails,
  onClose,
}: QuickViewContentProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColorCode, setSelectedColorCode] = useState<string | null>(null);
  const [selectedSizeTitle, setSelectedSizeTitle] = useState<string | null>(null);

  const { Title, Description, CoverImage, Media, product_variations } = productData.attributes;

  const allImages = useMemo(() => {
    const images: string[] = [];

    if (CoverImage?.data?.attributes?.url) {
      images.push(resolveAssetUrl(CoverImage.data.attributes.url));
    }

    if (Media?.data) {
      for (const media of Media.data) {
        if (media.attributes?.url) images.push(resolveAssetUrl(media.attributes.url));
      }
    }

    // de-dupe (optional)
    return Array.from(new Set(images));
  }, [CoverImage, Media]);

  const variations: VariationUI[] = useMemo(() => {
    if (!product_variations?.data) return [];

    return product_variations.data
      .filter((v) => v.attributes?.IsPublished !== false)
      .map((variation) => {
        const {
          Price,
          DiscountPrice,
          product_stock,
          product_variation_color,
          product_variation_size,
        } = variation.attributes;

        const stock = product_stock?.data?.attributes?.Count ?? 0;
        const color = product_variation_color?.data?.attributes;
        const size = product_variation_size?.data?.attributes;

        const price = typeof Price === "string" ? parseFloat(Price) : (Price ?? 0);
        const discountPrice =
          DiscountPrice == null
            ? null
            : typeof DiscountPrice === "string"
              ? parseFloat(DiscountPrice)
              : DiscountPrice;

        return {
          id: variation.id,
          price,
          discountPrice,
          stock,
          color: color ? { title: color.Title, colorCode: color.ColorCode } : null,
          size: size ? { title: size.Title } : null,
        };
      });
  }, [product_variations]);

  // Defaults (derived) so UI highlights something even before user clicks
  const effectiveColorCode = selectedColorCode ?? variations[0]?.color?.colorCode ?? null;
  const effectiveSizeTitle = selectedSizeTitle ?? variations[0]?.size?.title ?? null;

  const currentVariation = useMemo(() => {
    if (!variations.length) return undefined;

    const matches = variations.filter((v) => {
      const okColor = effectiveColorCode ? v.color?.colorCode === effectiveColorCode : true;
      const okSize = effectiveSizeTitle ? v.size?.title === effectiveSizeTitle : true;
      return okColor && okSize;
    });

    return matches[0];
  }, [variations, effectiveColorCode, effectiveSizeTitle]);

  const hasDiscount = useMemo(() => {
    if (!currentVariation) return false;
    const { price, discountPrice } = currentVariation;
    return Boolean(discountPrice && discountPrice > 0 && discountPrice < price);
  }, [currentVariation]);

  const discountPercent = useMemo(() => {
    if (!hasDiscount || !currentVariation?.discountPrice) return 0;
    const result = computeDiscountForVariation({
      Price: currentVariation.price,
      DiscountPrice: currentVariation.discountPrice,
    });
    return result?.discountPercent ?? 0;
  }, [hasDiscount, currentVariation]);

  const colors = useMemo(() => {
    const uniqueColors = new Map<string, { title: string; colorCode: string }>();
    for (const v of variations) {
      if (v.color && !uniqueColors.has(v.color.colorCode)) {
        uniqueColors.set(v.color.colorCode, v.color);
      }
    }
    return Array.from(uniqueColors.values());
  }, [variations]);

  const sizes = useMemo(() => {
    const uniqueSizes = new Map<string, { title: string }>();
    for (const v of variations) {
      if (v.size && !uniqueSizes.has(v.size.title)) uniqueSizes.set(v.size.title, v.size);
    }
    return Array.from(uniqueSizes.values());
  }, [variations]);

  const isInStock = currentVariation ? currentVariation.stock > 0 : false;

  // Optional: sizes available under selected color (better UX)
  const availableSizesForColor = useMemo(() => {
    if (!effectiveColorCode) return new Set(sizes.map((s) => s.title));
    const set = new Set<string>();
    for (const v of variations) {
      if (v.color?.colorCode === effectiveColorCode && v.size?.title) set.add(v.size.title);
    }
    return set;
  }, [effectiveColorCode, sizes, variations]);

  const sanitizedDescription = useMemo(() => {
    return DOMPurify.sanitize(Description || "");
  }, [Description]);

  return (
    <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:p-8">
      <QuickViewGallery
        images={allImages}
        title={Title}
        selectedIndex={selectedImageIndex}
        onSelectIndex={setSelectedImageIndex}
        onClose={onClose}
        hasDiscount={hasDiscount}
        discountPercent={discountPercent}
      />

      {/* Info */}
      <div className="flex min-h-0 flex-col gap-5">
        <div className="space-y-2">
          <h2
            id="quick-view-title"
            className="text-lg font-semibold text-gray-900 sm:text-xl lg:text-2xl"
          >
            {Title}
          </h2>

          {/* Stock pill */}
          <div
            className={[
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ring-1",
              isInStock
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-rose-50 text-rose-700 ring-rose-200",
            ].join(" ")}
          >
            <span className="h-2 w-2 rounded-full bg-current opacity-70" />
            <span>{isInStock ? "موجود در انبار" : "ناموجود"}</span>
          </div>
        </div>

        {/* Price and Actions */}
        {currentVariation ? (
          <QuickViewPricing
            price={currentVariation.price}
            discountPrice={currentVariation.discountPrice}
            hasDiscount={hasDiscount}
            onViewFullDetails={onViewFullDetails}
            onClose={onClose}
          />
        ) : (
          <div className="flex flex-col gap-5">
            <div className="rounded-3xl bg-amber-50 p-4 ring-1 ring-amber-200">
              <p className="text-sm text-amber-800">
                ترکیب انتخاب‌شده موجود نیست. لطفاً رنگ یا سایز دیگری انتخاب کنید.
              </p>
            </div>

            <div className="sticky bottom-0 -mx-4 mt-auto border-t border-black/5 bg-white/80 p-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onViewFullDetails}
                  className="flex-1 rounded-2xl bg-pink-500 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-pink-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
                >
                  مشاهده جزئیات کامل
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-gray-700 ring-1 ring-black/10 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Variations */}
        <QuickViewVariationSelector
          colors={colors}
          sizes={sizes}
          effectiveColorCode={effectiveColorCode}
          effectiveSizeTitle={effectiveSizeTitle}
          availableSizesForColor={availableSizesForColor}
          onSelectColor={(colorCode) => {
            setSelectedColorCode(colorCode);
            // Re-compute available sizes for the NEW color inline to decide if we should reset size
            const sizesForNewColor = new Set(
              variations
                .filter((v) => v.color?.colorCode === colorCode && v.size?.title)
                .map((v) => v.size!.title)
            );
            if (selectedSizeTitle && !sizesForNewColor.has(selectedSizeTitle)) {
              setSelectedSizeTitle(null);
            }
          }}
          onSelectSize={setSelectedSizeTitle}
        />

        {/* Description */}
        {Description && (
          <div className="rounded-3xl bg-white ring-1 ring-black/5">
            <div className="border-b border-black/5 px-4 py-3">
              <h3 className="text-sm font-medium text-gray-800">توضیحات</h3>
            </div>
            <div
              className="prose prose-sm line-clamp-4 max-w-none px-4 py-3 text-sm text-gray-600 sm:line-clamp-6"
              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
