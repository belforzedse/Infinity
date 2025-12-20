"use client";

import dynamic from "next/dynamic";
import { IMAGE_BASE_URL } from "@/constants/api";
import { calculateUniqueColorsCount, getUniqueColorCodes } from "@/services/product/product";
import {
  getFirstValidVariation,
  getVariationPriceDetails,
  hasAvailableStock,
} from "@/utils/product";
import type { PLPProduct } from "@/components/PLP/types";

const ProductSmallCard = dynamic(() => import("@/components/Product/SmallCard"), {
  loading: () => <div className="h-24 animate-pulse rounded-lg bg-gray-200" />,
});

interface PLPMobileListProps {
  products: PLPProduct[];
}

export default function PLPMobileList({ products }: PLPMobileListProps) {
  return (
    <div className="flex flex-col gap-4 md:hidden">
      {products.map((product, index) => {
        const firstValidVariation = getFirstValidVariation(product);
        const { price, discount, discountPrice } = firstValidVariation
          ? getVariationPriceDetails(firstValidVariation)
          : { price: 0, discount: undefined, discountPrice: undefined };
        const isAvailable = hasAvailableStock(product);
        const slug = product.attributes?.Slug;

        return (
          <ProductSmallCard
            key={product.id}
            id={product.id}
            slug={slug}
            title={product.attributes.Title}
            category={product.attributes.product_main_category?.data?.attributes?.Title || ""}
            likedCount={product.attributes.RatingCount || 0}
            price={price}
            discountedPrice={discountPrice}
            discount={discount}
            image={
              product.attributes.CoverImage?.data?.attributes?.url
                ? `${IMAGE_BASE_URL}${product.attributes.CoverImage.data.attributes.url}`
                : ""
            }
            isAvailable={isAvailable}
            priority={index < 3}
            colorsCount={calculateUniqueColorsCount(
              product.attributes.product_variations?.data || [],
            )}
            colorCodes={getUniqueColorCodes(product.attributes.product_variations?.data || [])}
          />
        );
      })}
    </div>
  );
}
