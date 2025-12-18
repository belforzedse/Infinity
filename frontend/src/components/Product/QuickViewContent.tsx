"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ProductDetail } from "@/services/product/product";
import { faNum } from "@/utils/faNum";
import { resolveAssetUrl } from "@/utils/resolveAssetUrl";
import { computeDiscountForVariation } from "@/utils/discounts";
import imageLoader from "@/utils/imageLoader";

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

    return matches[0] ?? variations[0];
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

  return (
    <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:p-8">
      {/* Gallery */}
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-3xl bg-neutral-50 ring-1 ring-black/5">
          {/* Top-right close (nice on mobile) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 ring-1 ring-black/10 backdrop-blur transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5 text-gray-700" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.22 4.22a.75.75 0 011.06 0L10 8.94l4.72-4.72a.75.75 0 111.06 1.06L11.06 10l4.72 4.72a.75.75 0 11-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 11-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Discount badge on image */}
          {hasDiscount && (
            <div className="absolute left-3 top-3 z-10 rounded-full bg-rose-600 px-3 py-1 text-xs font-medium text-white shadow-sm">
              {faNum(discountPercent)}% تخفیف
            </div>
          )}

          {/* Main image */}
          <div className="relative aspect-square sm:aspect-[4/5]">
            {allImages.length > 0 ? (
              <Image
                src={allImages[Math.min(selectedImageIndex, allImages.length - 1)]}
                alt={Title}
                fill
                className="object-contain p-3 sm:p-4"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                loader={imageLoader}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <span>تصویر موجود نیست</span>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {allImages.map((img, index) => {
              const active = selectedImageIndex === index;
              return (
                <button
                  key={img + index}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={[
                    "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl ring-1 transition",
                    active ? "ring-pink-500" : "ring-black/10 hover:ring-pink-300",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500",
                  ].join(" ")}
                  aria-label={`تصویر ${faNum(index + 1)}`}
                  aria-current={active ? "true" : "false"}
                >
                  <Image
                    src={img}
                    alt={`${Title} - تصویر ${faNum(index + 1)}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                    loader={imageLoader}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

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

        {/* Price */}
        {currentVariation && (
          <div className="rounded-3xl bg-gray-50 p-4 ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">قیمت</span>
              {hasDiscount && (
                <span className="text-xs text-gray-500">
                  قبل: <span className="line-through">{faNum(currentVariation.price)} تومان</span>
                </span>
              )}
            </div>

            <div className="mt-2 flex items-end justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                  {faNum(
                    hasDiscount && currentVariation.discountPrice
                      ? currentVariation.discountPrice
                      : currentVariation.price,
                  )}
                </span>
                <span className="text-sm text-gray-500">تومان</span>
              </div>

              {hasDiscount && currentVariation.discountPrice && (
                <span className="rounded-full bg-white px-3 py-1 text-sm text-rose-700 ring-1 ring-rose-200">
                  صرفه‌جویی: {faNum(currentVariation.price - currentVariation.discountPrice)} تومان
                </span>
              )}
            </div>
          </div>
        )}

        {/* Colors */}
        {colors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-800">رنگ</h3>
              <span className="text-xs text-gray-500">
                {colors.find((c) => c.colorCode === effectiveColorCode)?.title ?? ""}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {colors.map((color) => {
                const active = color.colorCode === effectiveColorCode;
                return (
                  <button
                    key={color.colorCode}
                    type="button"
                    onClick={() => {
                      setSelectedColorCode(color.colorCode);
                      // if current size becomes invalid under new color, reset size
                      if (selectedSizeTitle && !availableSizesForColor.has(selectedSizeTitle)) {
                        setSelectedSizeTitle(null);
                      }
                    }}
                    title={color.title}
                    aria-pressed={active}
                    className={[
                      "relative h-10 w-10 rounded-full ring-1 transition",
                      active ? "ring-pink-500" : "ring-black/10 hover:ring-pink-300",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500",
                    ].join(" ")}
                    style={{ backgroundColor: color.colorCode }}
                  >
                    <span className="sr-only">{color.title}</span>
                    {active && (
                      <span className="absolute inset-0 grid place-items-center">
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-white/80 text-gray-900 ring-1 ring-black/10">
                          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M16.704 5.29a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414l2.793 2.793 6.793-6.793a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sizes */}
        {sizes.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-800">سایز</h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const active = size.title === effectiveSizeTitle;
                const disabled = !availableSizesForColor.has(size.title);

                return (
                  <button
                    key={size.title}
                    type="button"
                    onClick={() => setSelectedSizeTitle(size.title)}
                    aria-pressed={active}
                    disabled={disabled}
                    className={[
                      "rounded-2xl px-4 py-2 text-sm ring-1 transition",
                      active
                        ? "bg-pink-50 text-pink-700 ring-pink-200"
                        : "bg-white text-gray-700 ring-black/10 hover:bg-pink-50/50 hover:ring-pink-200",
                      disabled
                        ? "cursor-not-allowed opacity-50 hover:bg-white hover:ring-black/10"
                        : "",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500",
                    ].join(" ")}
                  >
                    {size.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        {Description && (
          <div className="rounded-3xl bg-white ring-1 ring-black/5">
            <div className="border-b border-black/5 px-4 py-3">
              <h3 className="text-sm font-medium text-gray-800">توضیحات</h3>
            </div>
            <div
              className="prose prose-sm line-clamp-4 max-w-none px-4 py-3 text-sm text-gray-600 sm:line-clamp-6"
              dangerouslySetInnerHTML={{ __html: Description }}
            />
          </div>
        )}

        {/* Actions (sticky on mobile) */}
        <div className="sticky bottom-0 -mx-4 mt-auto border-t border-black/5 bg-white/80 p-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
          <div className="flex gap-3">
            <button
              onClick={onViewFullDetails}
              className="flex-1 rounded-2xl bg-pink-500 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-pink-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
            >
              مشاهده جزئیات کامل
            </button>
            <button
              onClick={onClose}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-gray-700 ring-1 ring-black/10 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
