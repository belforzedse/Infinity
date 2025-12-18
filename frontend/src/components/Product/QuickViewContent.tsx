"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
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

export default function QuickViewContent({
  productData,
  productId,
  onViewFullDetails,
  onClose,
}: QuickViewContentProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);

  // Extract product data
  const { Title, Description, CoverImage, Media, product_variations } = productData.attributes;

  // Get all images (cover + media)
  const allImages = useMemo(() => {
    const images: string[] = [];

    // Add cover image
    if (CoverImage?.data?.attributes?.url) {
      images.push(resolveAssetUrl(CoverImage.data.attributes.url));
    }

    // Add media images
    if (Media?.data) {
      Media.data.forEach((media) => {
        if (media.attributes?.url) {
          images.push(resolveAssetUrl(media.attributes.url));
        }
      });
    }

    return images;
  }, [CoverImage, Media]);

  // Get variations
  const variations = useMemo(() => {
    if (!product_variations?.data) return [];

    return product_variations.data
      .filter((v) => v.attributes?.IsPublished !== false)
      .map((variation) => {
        const { Price, DiscountPrice, product_stock, product_variation_color, product_variation_size } =
          variation.attributes;

        const stock = product_stock?.data?.attributes?.Count || 0;
        const color = product_variation_color?.data?.attributes;
        const size = product_variation_size?.data?.attributes;

        return {
          id: variation.id,
          price: typeof Price === "string" ? parseFloat(Price) : Price,
          discountPrice:
            DiscountPrice && typeof DiscountPrice === "string"
              ? parseFloat(DiscountPrice)
              : DiscountPrice,
          stock,
          color: color
            ? {
                title: color.Title,
                colorCode: color.ColorCode,
              }
            : null,
          size: size
            ? {
                title: size.Title,
              }
            : null,
        };
      });
  }, [product_variations]);

  // Get selected variation data or use first variation
  const currentVariation = useMemo(() => {
    if (selectedVariation !== null) {
      return variations.find((v) => v.id === selectedVariation);
    }
    return variations[0];
  }, [variations, selectedVariation]);

  // Calculate discount
  const hasDiscount = useMemo(() => {
    if (!currentVariation) return false;
    const price = typeof currentVariation.price === "string" ? parseFloat(currentVariation.price) : currentVariation.price;
    const discountPrice = typeof currentVariation.discountPrice === "string" ? parseFloat(currentVariation.discountPrice) : currentVariation.discountPrice;
    return Boolean(
      discountPrice &&
        discountPrice > 0 &&
        discountPrice < price,
    );
  }, [currentVariation]);

  const discountPercent = useMemo(() => {
    if (!hasDiscount || !currentVariation) return 0;
    const price = typeof currentVariation.price === "string" ? parseFloat(currentVariation.price) : currentVariation.price;
    const discountPrice = typeof currentVariation.discountPrice === "string" ? parseFloat(currentVariation.discountPrice) : currentVariation.discountPrice;
    const result = computeDiscountForVariation({ Price: price, DiscountPrice: discountPrice });
    return result?.discountPercent ?? 0;
  }, [hasDiscount, currentVariation]);

  // Get unique colors
  const colors = useMemo(() => {
    const uniqueColors = new Map();
    variations.forEach((v) => {
      if (v.color && !uniqueColors.has(v.color.colorCode)) {
        uniqueColors.set(v.color.colorCode, v.color);
      }
    });
    return Array.from(uniqueColors.values());
  }, [variations]);

  // Get unique sizes
  const sizes = useMemo(() => {
    const uniqueSizes = new Map();
    variations.forEach((v) => {
      if (v.size && !uniqueSizes.has(v.size.title)) {
        uniqueSizes.set(v.size.title, v.size);
      }
    });
    return Array.from(uniqueSizes.values());
  }, [variations]);

  const isInStock = currentVariation ? currentVariation.stock > 0 : false;

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-2 lg:gap-10 lg:p-10">
      {/* Image Gallery */}
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
          {allImages.length > 0 ? (
            <Image
              src={allImages[selectedImageIndex]}
              alt={Title}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              loader={imageLoader}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <span>تصویر موجود نیست</span>
            </div>
          )}
        </div>

        {/* Thumbnail List */}
        {allImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {allImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  selectedImageIndex === index
                    ? "border-pink-500 ring-2 ring-pink-200"
                    : "border-gray-200 hover:border-pink-300"
                }`}
              >
                <Image
                  src={img}
                  alt={`${Title} - تصویر ${faNum(index + 1)}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  loader={imageLoader}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col gap-6">
        {/* Title */}
        <div>
          <h2 id="quick-view-title" className="text-2xl text-gray-900 lg:text-3xl">
            {Title}
          </h2>
        </div>

        {/* Price */}
        {currentVariation && (
          <div className="rounded-2xl bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">قیمت</span>
              {hasDiscount && (
                <span className="rounded-full bg-rose-600 px-3 py-1 text-sm text-white">
                  {faNum(discountPercent)}% تخفیف
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              {hasDiscount && currentVariation.discountPrice && (
                <span className="text-2xl text-pink-600 lg:text-3xl">
                  {faNum(currentVariation.discountPrice)} تومان
                </span>
              )}
              <span
                className={`${
                  hasDiscount
                    ? "text-lg text-gray-400 line-through"
                    : "text-2xl text-gray-900 lg:text-3xl"
                }`}
              >
                {faNum(currentVariation.price)} تومان
              </span>
            </div>
          </div>
        )}

        {/* Colors */}
        {colors.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm text-gray-700">رنگ</h3>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color.colorCode}
                  className="group relative h-10 w-10 overflow-hidden rounded-full border-2 border-gray-200 transition-all hover:border-pink-300"
                  title={color.title}
                  style={{ backgroundColor: color.colorCode }}
                >
                  <span className="sr-only">{color.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sizes */}
        {sizes.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-700">سایز</h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size.title}
                  className="rounded-lg border-2 border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-pink-300 hover:bg-pink-50"
                >
                  {size.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stock Status */}
        <div>
          {isInStock ? (
            <div className="flex items-center gap-2 text-green-600">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">موجود در انبار</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">ناموجود</span>
            </div>
          )}
        </div>

        {/* Description */}
        {Description && (
          <div>
            <h3 className="mb-2 text-sm text-gray-700">توضیحات</h3>
            <div
              className="prose prose-sm max-w-none line-clamp-3 text-sm text-gray-600"
              dangerouslySetInnerHTML={{ __html: Description }}
            />
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-3">
          <button
            onClick={onViewFullDetails}
            className="flex-1 rounded-xl bg-pink-500 px-6 py-4 font-medium text-white transition-colors hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          >
            مشاهده جزئیات کامل
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border-2 border-gray-200 px-6 py-4 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
