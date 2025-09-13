import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import { ProductCardProps } from "@/components/Product/Card";
import { formatProductsToCardProps } from "./product";
import logger from "@/utils/logger";

/**
 * Fetch products that have active discounts.
 */
export const getDiscountedProducts = async (): Promise<ProductCardProps[]> => {
  const endpoint =
    `${ENDPOINTS.PRODUCT.PRODUCT}?filters[Status][$eq]=Active&` +
    `populate[0]=CoverImage&` +
    `populate[1]=product_main_category&` +
    `populate[2]=product_variations&` +
    `populate[3]=product_variations.general_discounts&` +
    `pagination[limit]=20`;

  try {
    const response = await apiClient.get<any>(endpoint);
    const discounted = (response as any)?.data?.filter((product: any) =>
      product.attributes.product_variations?.data?.some(
        (variation: any) =>
          variation.attributes.general_discounts?.data?.length > 0,
      ),
    );

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
  const endpoint =
    `${ENDPOINTS.PRODUCT.PRODUCT}?filters[Status][$eq]=Active&` +
    `populate[0]=CoverImage&` +
    `populate[1]=product_main_category&` +
    `populate[2]=product_variations&` +
    `populate[3]=product_variations.general_discounts&` +
    `sort[0]=createdAt:desc&pagination[limit]=20`;

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
  const endpoint =
    `${ENDPOINTS.PRODUCT.PRODUCT}?filters[Status][$eq]=Active&` +
    `populate[0]=CoverImage&` +
    `populate[1]=product_main_category&` +
    `populate[2]=product_variations&` +
    `populate[3]=product_variations.general_discounts&` +
    `sort[0]=AverageRating:desc&pagination[limit]=20`;

  try {
    const response = await apiClient.get<any>(endpoint);
    return formatProductsToCardProps((response as any).data);
  } catch (error) {
    logger.error("Error fetching favorite products:", error as any);
    return [];
  }
};
