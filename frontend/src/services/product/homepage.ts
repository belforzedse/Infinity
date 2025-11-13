import { apiClient } from "@/services";
import { ENDPOINTS, API_BASE_URL } from "@/constants/api";
import type { ProductCardProps } from "@/components/Product/Card";
import { formatProductsToCardProps } from "./product";
import logger from "@/utils/logger";

const productHasStock = (product: any): boolean => {
  const variations = product?.attributes?.product_variations?.data;
  if (!Array.isArray(variations)) return false;

  return variations.some((variation: any) => {
    const stockCount = variation?.attributes?.product_stock?.data?.attributes?.Count;
    const numericStock =
      typeof stockCount === "number"
        ? stockCount
        : stockCount !== undefined && stockCount !== null
          ? Number(stockCount)
          : 0;
    return Number.isFinite(numericStock) && numericStock > 0;
  });
};

/**
 * Fetch all homepage product sections in one API call
 * Reduces 3 API calls to 1 (66% reduction)
 * Filters and sorts products in memory for each section
 */
export const getHomepageSections = async (): Promise<{
  discounted: ProductCardProps[];
  new: ProductCardProps[];
  favorites: ProductCardProps[];
}> => {
  // Fetch a larger pool of products (60) to ensure we have enough for all sections after filtering
  const endpoint =
    `${ENDPOINTS.PRODUCT.PRODUCT}?filters[Status][$eq]=Active&` +
    `populate[0]=CoverImage&` +
    `populate[1]=product_main_category&` +
    `populate[2]=product_variations&` +
    `populate[3]=product_variations.product_stock&` +
    `populate[4]=product_variations.general_discounts&` +
    `filters[product_variations][Price][$gte]=1&` +
    `filters[product_variations][product_stock][Count][$gt]=0&` +
    `pagination[limit]=60`; // Fetch more to have enough after filtering

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      next: { revalidate: 60 }, // Revalidate every minute
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }).then(res => res.json());

    const allProducts = (response as any)?.data || [];
    const availableProducts = allProducts.filter(productHasStock);
    logger.info(`[BatchHomepage] Fetched ${allProducts.length} total products for all sections`);

    // Filter for discounted products
    const discountedProducts = availableProducts.filter((product: any) => {
      const hasDiscountedVariation = product.attributes.product_variations?.data?.some((variation: any) => {
        const stockCount = variation.attributes.product_stock?.data?.attributes?.Count;
        const hasStock = typeof stockCount === "number" && stockCount > 0;
        if (!hasStock) return false;

        const price = parseFloat(variation.attributes.Price);
        const generalDiscounts = variation.attributes.general_discounts?.data;
        if (generalDiscounts && generalDiscounts.length > 0) return true;

        const discountPrice = variation.attributes.DiscountPrice ? parseFloat(variation.attributes.DiscountPrice) : null;
        return discountPrice && discountPrice < price;
      });
      return hasDiscountedVariation;
    }).slice(0, 20); // Limit to 20

    // Filter for new products (by createdAt)
    const newProducts = [...availableProducts]
      .sort((a: any, b: any) => {
        const dateA = new Date(a.attributes.createdAt).getTime();
        const dateB = new Date(b.attributes.createdAt).getTime();
        return dateB - dateA; // Newest first
      })
      .slice(0, 20);

    // Filter for favorite products (by rating)
    const favoriteProducts = [...availableProducts]
      .sort((a: any, b: any) => {
        const ratingA = parseFloat(a.attributes.AverageRating) || 0;
        const ratingB = parseFloat(b.attributes.AverageRating) || 0;
        return ratingB - ratingA; // Highest rating first
      })
      .slice(0, 20);

    logger.info(`[BatchHomepage] Split into: ${discountedProducts.length} discounted, ${newProducts.length} new, ${favoriteProducts.length} favorites`);

    return {
      discounted: formatProductsToCardProps(discountedProducts),
      new: formatProductsToCardProps(newProducts),
      favorites: formatProductsToCardProps(favoriteProducts),
    };
  } catch (error) {
    logger.error("[BatchHomepage] Error fetching homepage sections:", error as any);
    return { discounted: [], new: [], favorites: [] };
  }
};

/**
 * Fetch products that have active discounts.
 */
export const getDiscountedProducts = async (): Promise<ProductCardProps[]> => {
  const endpoint =
    `${ENDPOINTS.PRODUCT.PRODUCT}?filters[Status][$eq]=Active&` +
    `populate[0]=CoverImage&` +
    `populate[1]=product_main_category&` +
    `populate[2]=product_variations&` +
    `populate[3]=product_variations.product_stock&` +
    `populate[4]=product_variations.general_discounts&` +
    `filters[product_variations][Price][$gte]=1&` +
    `filters[product_variations][product_stock][Count][$gt]=0&` +
    `pagination[limit]=20`;

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      next: { revalidate: 60 }, // Revalidate every minute
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }).then(res => res.json());

    const allProducts = (response as any)?.data || [];
    const availableProducts = allProducts.filter(productHasStock);
    logger.info(`Fetched ${allProducts.length} total products for discount check`);

    const discounted = availableProducts.filter((product: any) => {
      // Check if product has any variation with stock AND discount
      const hasDiscountedVariation = product.attributes.product_variations?.data?.some((variation: any) => {
        // Check if variation has stock
        const stockCount = variation.attributes.product_stock?.data?.attributes?.Count;
        const hasStock = typeof stockCount === "number" && stockCount > 0;

        if (!hasStock) return false;

        // Check for discounts
        const price = parseFloat(variation.attributes.Price);

        // Check for general_discounts first
        const generalDiscounts = variation.attributes.general_discounts?.data;
        if (generalDiscounts && generalDiscounts.length > 0) {
          logger.info(`Product ${product.id} has general_discounts:`, generalDiscounts.length);
          return true;
        }

        // Fallback to DiscountPrice field
        const discountPrice = variation.attributes.DiscountPrice
          ? parseFloat(variation.attributes.DiscountPrice)
          : null;
        if (discountPrice && discountPrice < price) {
          logger.info(`Product ${product.id} has DiscountPrice: ${discountPrice} < ${price}`);
          return true;
        }

        return false;
      });

      return hasDiscountedVariation;
    });

    logger.info(`Found ${discounted.length} discounted products`);
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
    `populate[3]=product_variations.product_stock&` +
    `populate[4]=product_variations.general_discounts&` +
    `filters[product_variations][Price][$gte]=1&` +
    `filters[product_variations][product_stock][Count][$gt]=0&` +
    `sort[0]=createdAt:desc&pagination[limit]=20`;


  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      next: { revalidate: 60 }, // Revalidate every minute
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }).then(res => res.json());
    const availableProducts = ((response as any).data || []).filter(productHasStock);
    return formatProductsToCardProps(availableProducts);
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
    `populate[3]=product_variations.product_stock&` +
    `populate[4]=product_variations.general_discounts&` +
    `filters[product_variations][Price][$gte]=1&` +
    `filters[product_variations][product_stock][Count][$gt]=0&` +
    `sort[0]=AverageRating:desc&pagination[limit]=20`;

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      next: { revalidate: 60 }, // Revalidate every minute
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }).then(res => res.json());
    const availableProducts = ((response as any).data || []).filter(productHasStock);
    return formatProductsToCardProps(availableProducts);
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
  const endpoint = 
    `${ENDPOINTS.PRODUCT.PRODUCT}?filters[Status][$eq]=Active&` +
      `populate[0]=CoverImage&` +
      `populate[1]=product_main_category&` +
      `populate[2]=product_variations&` +
      `populate[3]=product_variations.product_stock&` +
      `populate[4]=product_variations.general_discounts&` +
      // Hide zero-price variations
      `filters[product_variations][Price][$gte]=1&` +
      `filters[product_variations][product_stock][Count][$gt]=0&` +
      `pagination[limit]=${poolSize}`;


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
