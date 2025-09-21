import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import { appendTitleFilter } from "@/constants/productFilters";
import type { ProductCardProps } from "@/components/Product/Card";
import { formatProductsToCardProps } from "./product";
import logger from "@/utils/logger";

/**
 * Fetch products that have active discounts.
 */
export const getDiscountedProducts = async (): Promise<ProductCardProps[]> => {
  const endpoint = appendTitleFilter(
    `${ENDPOINTS.PRODUCT.PRODUCT}?filters[Status][$eq]=Active&` +
      `populate[0]=CoverImage&` +
      `populate[1]=product_main_category&` +
      `populate[2]=product_variations&` +
      `populate[3]=product_variations.product_stock&` +
      `populate[4]=product_variations.general_discounts&` +
      // Hide zero-price and zero-stock variations
      `filters[product_variations][Price][$gte]=1&` +
      // Hide zero-stock items
      `filters[product_variations][product_stock][Count][$gt]=0&` +
      `pagination[limit]=20`,
  );

  try {
    const response = await apiClient.get<any>(endpoint);
    const discounted = (response as any)?.data?.filter((product: any) => {
      // Check if product has any variation with stock AND discount
      return product.attributes.product_variations?.data?.some((variation: any) => {
        // Check if variation has stock
        const stockCount = variation.attributes.product_stock?.data?.attributes?.Count;
        const hasStock = typeof stockCount === "number" && stockCount > 0;

        if (!hasStock) return false;

        // Check for discounts
        const price = parseFloat(variation.attributes.Price);

        // Check for general_discounts first
        const generalDiscounts = variation.attributes.general_discounts?.data;
        if (generalDiscounts && generalDiscounts.length > 0) {
          return true;
        }

        // Fallback to DiscountPrice field
        const discountPrice = variation.attributes.DiscountPrice
          ? parseFloat(variation.attributes.DiscountPrice)
          : null;
        return discountPrice && discountPrice < price;
      });
    });

    return formatProductsToCardProps(discounted);
  } catch (error) {
    logger.error("Error fetching discounted products:", error as any);
    return [];
  }
};

/**
 * Fetch newest products.
 */
export const getNewProducts = async (): Promise<ProductCardProps[]> => {
  const endpoint = appendTitleFilter(
    `${ENDPOINTS.PRODUCT.PRODUCT}?filters[Status][$eq]=Active&` +
      `populate[0]=CoverImage&` +
      `populate[1]=product_main_category&` +
      `populate[2]=product_variations&` +
      `populate[3]=product_variations.product_stock&` +
      `populate[4]=product_variations.general_discounts&` +
      // Hide zero-price and zero-stock variations
      `filters[product_variations][Price][$gte]=1&` +
      // Hide zero-stock items
      `filters[product_variations][product_stock][Count][$gt]=0&` +
      `sort[0]=createdAt:desc&pagination[limit]=20`,
  );

  try {
    const response = await apiClient.get<any>(endpoint);
    return formatProductsToCardProps((response as any).data);
  } catch (error) {
    logger.error("Error fetching new products:", error as any);
    return [];
  }
};

/**
 * Fetch highest rated products.
 */
export const getFavoriteProducts = async (): Promise<ProductCardProps[]> => {
  const endpoint = appendTitleFilter(
    `${ENDPOINTS.PRODUCT.PRODUCT}?filters[Status][$eq]=Active&` +
      `populate[0]=CoverImage&` +
      `populate[1]=product_main_category&` +
      `populate[2]=product_variations&` +
      `populate[3]=product_variations.product_stock&` +
      `populate[4]=product_variations.general_discounts&` +
      // Hide zero-price and zero-stock variations
      `filters[product_variations][Price][$gte]=1&` +
      // Hide zero-stock items
      `filters[product_variations][product_stock][Count][$gt]=0&` +
      `sort[0]=AverageRating:desc&pagination[limit]=20`,
  );

  try {
    const response = await apiClient.get<any>(endpoint);
    return formatProductsToCardProps((response as any).data);
  } catch (error) {
    logger.error("Error fetching favorite products:", error as any);
    return [];
  }
};

/**
 * Fetch a random assortment of active, in-stock products.
 * Strategy: fetch a larger pool and shuffle client-side.
 */
export const getRandomProducts = async (
  poolSize: number = 60,
  take: number = 20,
): Promise<ProductCardProps[]> => {
  const endpoint = appendTitleFilter(
    `${ENDPOINTS.PRODUCT.PRODUCT}?filters[Status][$eq]=Active&` +
      `populate[0]=CoverImage&` +
      `populate[1]=product_main_category&` +
      `populate[2]=product_variations&` +
      `populate[3]=product_variations.product_stock&` +
      `populate[4]=product_variations.general_discounts&` +
      // Hide zero-price and zero-stock variations
      `filters[product_variations][Price][$gte]=1&` +
      // Hide zero-stock items
      `filters[product_variations][product_stock][Count][$gt]=0&` +
      `pagination[limit]=${poolSize}`,
  );

  try {
    // Public products endpoint: avoid sending user token to prevent accidental 401/logout
    const response = await apiClient.getPublic<any>(endpoint, {
      suppressAuthRedirect: true,
    });
    const list = formatProductsToCardProps((response as any).data);
    // Shuffle (Fisher–Yates)
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list.slice(0, take);
  } catch (error) {
    logger.error("Error fetching random products:", error as any);
    return [];
  }
};
