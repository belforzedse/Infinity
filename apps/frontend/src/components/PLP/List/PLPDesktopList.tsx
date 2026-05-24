"use client";

import dynamic from "next/dynamic";
import { IMAGE_BASE_URL } from "@/constants/api";
import { calculateUniqueColorsCount, getUniqueColorCodes } from "@/services/product/product";
import {
  getFirstValidVariation,
  getProductImages,
  getVariationPriceDetails,
  hasAvailableStock,
} from "@/utils/product";
import type { PLPProduct } from "@/components/PLP/types";
import { StorefrontGrid } from "@/components/storefront";

const ProductCard = dynamic(() => import("@/components/Product/Card"), {
  loading: () => <div className="h-48 animate-pulse rounded-lg bg-gray-200" />,
});

interface PLPDesktopListProps {
  products: PLPProduct[];
  includeMedia: boolean;
}

export default function PLPDesktopList({ products, includeMedia }: PLPDesktopListProps) {
  return (
    <StorefrontGrid variant="plp" className="hidden md:grid">
      {products.map((product, index) => {
        const firstValidVariation = getFirstValidVariation(product);
        const { price, discount, discountPrice } = getVariationPriceDetails(firstValidVariation);
        const generalDiscounts = firstValidVariation?.attributes?.general_discounts?.data;

        if (process.env.NODE_ENV !== "production" && (discount || discountPrice)) {
          console.log(`PLP Desktop - Product ${product.id}:`, {
            title: product.attributes.Title.substring(0, 30),
            originalPrice: price,
            discountPrice,
            discount,
            generalDiscounts: generalDiscounts,
            variationData: firstValidVariation?.attributes,
          });
        }

        const isAvailable = hasAvailableStock(product);
        const slug = product.attributes?.Slug || product.id.toString();
        const seenCount = product.attributes.SeenCount || 0;
        const allImages = getProductImages(product, includeMedia, IMAGE_BASE_URL);

        return (
          <ProductCard
            key={product.id}
            id={product.id}
            slug={slug}
            seenCount={seenCount}
            images={allImages.length > 0 ? allImages : []}
            category={product.attributes.product_main_category?.data?.attributes?.Title || ""}
            title={product.attributes.Title}
            price={price}
            discount={discount}
            discountPrice={discountPrice}
            colorsCount={calculateUniqueColorsCount(
              product.attributes.product_variations?.data || [],
            )}
            colorCodes={getUniqueColorCodes(product.attributes.product_variations?.data || [])}
            isAvailable={isAvailable}
            priority={index < 6}
          />
        );
      })}
    </StorefrontGrid>
  );
}
