import { useMemo } from "react";
import type { ProductCardProps } from "@/components/Product/Card";
import type { ProductSmallCardProps } from "@/components/Product/SmallCard";
import { IMAGE_BASE_URL } from "@/constants/api";
import { calculateUniqueColorsCount, getUniqueColorCodes } from "@/services/product/product";
import type { PLPProduct } from "@/components/PLP/types";
import { getProductPrimaryPricing, hasAvailableStock } from "@/utils/product";

interface UseSidebarProductsArgs {
  validProducts: PLPProduct[];
  discountedSidebarProducts?: ProductCardProps[];
  suggestedSidebarProducts?: ProductCardProps[];
}

interface UseSidebarProductsResult {
  sidebarProducts: ProductSmallCardProps[];
  mappedDiscountedSidebar: ProductSmallCardProps[];
  mappedSuggestedSidebar: ProductSmallCardProps[];
}

const hasImage = (product: PLPProduct): boolean => {
  return Boolean(
    product.attributes?.CoverImage?.data?.attributes?.url ||
      product.attributes?.CoverImage?.data,
  );
};

const mapProductCardToSmallCard = (
  products: ProductCardProps[],
): ProductSmallCardProps[] => {
  return products
    .filter((p) => p.isAvailable && p.images && p.images[0] && p.images[0] !== "")
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category,
      likedCount: p.seenCount || 0,
      price: p.price,
      discountedPrice: p.discountPrice,
      discount: p.discount,
      image: p.images[0] || "",
      isAvailable: p.isAvailable,
      colorsCount: p.colorsCount,
      colorCodes: p.colorCodes,
    }));
};

export const useSidebarProducts = ({
  validProducts,
  discountedSidebarProducts = [],
  suggestedSidebarProducts = [],
}: UseSidebarProductsArgs): UseSidebarProductsResult => {
  const sidebarProducts = useMemo(() => {
    return validProducts
      .filter((product) => hasAvailableStock(product) && hasImage(product))
      .slice(0, 3)
      .map((product) => {
        try {
          const { price, discount, discountPrice } = getProductPrimaryPricing(product, {
            requirePositiveGeneralDiscount: true,
          });

          if (Number.isNaN(price) || price <= 0) {
            throw new Error("Invalid price for sidebar product");
          }

          return {
            id: product.id,
            title: product.attributes.Title || "",
            category: product.attributes.product_main_category?.data?.attributes?.Title || "",
            likedCount: product.attributes.RatingCount || 0,
            price: price,
            discountedPrice: discountPrice,
            discount: discount,
            image: product.attributes.CoverImage?.data?.attributes?.url
              ? `${IMAGE_BASE_URL}${product.attributes.CoverImage.data.attributes.url}`
              : "",
            colorsCount: calculateUniqueColorsCount(
              product.attributes.product_variations?.data || [],
            ),
            colorCodes: getUniqueColorCodes(product.attributes.product_variations?.data || []),
          };
        } catch (error) {
          return {
            id: product.id,
            title: product.attributes?.Title || "",
            category: "",
            likedCount: 0,
            price: 0,
            discountedPrice: undefined,
            discount: undefined,
            image: "",
            colorsCount: 0,
            colorCodes: [],
          };
        }
      })
      .filter((product) => product.price > 0);
  }, [validProducts]);

  const mappedDiscountedSidebar = useMemo(() => {
    return mapProductCardToSmallCard(discountedSidebarProducts);
  }, [discountedSidebarProducts]);

  const mappedSuggestedSidebar = useMemo(() => {
    return mapProductCardToSmallCard(suggestedSidebarProducts);
  }, [suggestedSidebarProducts]);

  return { sidebarProducts, mappedDiscountedSidebar, mappedSuggestedSidebar };
};
