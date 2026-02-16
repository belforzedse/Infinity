import { apiClient } from "@/services";
import { ENDPOINTS, API_BASE_URL } from "@/constants/api";
import { buildTitleKeywordFilter } from "@/constants/productKeywords";
import type { ProductCardProps } from "@/components/Product/Card";
import { formatProductsToCardProps } from "./product";
import { productTitleMatchesKeywords } from "@/utils/product";
import logger from "@/utils/logger";

// Common fields for product queries
const PRODUCT_COMMON_FIELDS = [
  "fields[0]=Title",
  "fields[1]=Slug",
  "fields[2]=Status",
  "fields[3]=AverageRating",
  "fields[4]=SeenCount",
  "fields[5]=createdAt",
].join("&");

const HOMEPAGE_PRODUCT_POPULATE = [
  "populate[0]=CoverImage",
  "populate[1]=product_main_category",
  "populate[2]=product_variations",
  "populate[3]=product_variations.product_stock",
  "populate[4]=product_variations.general_discounts",
  "populate[5]=product_variations.product_variation_color",
].join("&");

const productHasStock = (product: any): boolean => {
  const variations = product?.attributes?.product_variations?.data;
  if (!Array.isArray(variations)) return false;

  return variations.some((variation: any) => {
    if (variation?.attributes?.IsPublished !== true) return false;
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

const HOMEPAGE_FETCH_OPTIONS = {
  next: { revalidate: 90 } as const,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

/**
 * Fetch homepage product sections: batch for discounted + favorites, separate request for "new" (title matches PRODUCT_BOOST_KEYWORDS).
 * "جدیدترین ها" = products whose Title contains any boost keyword (case-insensitive), newest first, up to 20.
 */
export const getHomepageSections = async (): Promise<{
  discounted: ProductCardProps[];
  new: ProductCardProps[];
  favorites: ProductCardProps[];
}> => {
  const batchEndpoint =
    `${ENDPOINTS.PRODUCT.PRODUCT}?filters[Status][$eq]=Active&` +
    `filters[removedAt][$null]=true&` +
    `${HOMEPAGE_PRODUCT_POPULATE}&` +
    `${PRODUCT_COMMON_FIELDS}&` +
    `filters[product_variations][Price][$gte]=1&` +
    `filters[product_variations][product_stock][Count][$gt]=0&` +
    `pagination[limit]=36&` +
    `pagination[withCount]=false`;

  const titleFilter = buildTitleKeywordFilter();
  const newEndpoint =
    `${ENDPOINTS.PRODUCT.PRODUCT}?filters[Status][$eq]=Active&` +
    `filters[removedAt][$null]=true&` +
    (titleFilter ? `${titleFilter}&` : "") +
    `${HOMEPAGE_PRODUCT_POPULATE}&` +
    `${PRODUCT_COMMON_FIELDS}&` +
    `filters[product_variations][Price][$gte]=1&` +
    `filters[product_variations][product_stock][Count][$gt]=0&` +
    `sort[0]=createdAt:desc&` +
    `pagination[limit]=20&` +
    `pagination[withCount]=false`;

  try {
    const [batchResponse, newResponse] = await Promise.all([
      fetch(`${API_BASE_URL}${batchEndpoint}`, HOMEPAGE_FETCH_OPTIONS).then((res) => res.json()),
      fetch(`${API_BASE_URL}${newEndpoint}`, HOMEPAGE_FETCH_OPTIONS).then((res) => res.json()),
    ]);

    const allProducts = (batchResponse as { data?: unknown[] })?.data || [];
    const availableProducts = allProducts.filter(productHasStock);
    logger.info(`[BatchHomepage] Fetched ${allProducts.length} total products for discounted/favorites`);

    // Filter for discounted products, then sort so products with G in title come first
    const discountedProducts = availableProducts
      .filter((product: any) => {
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
      })
      .sort((a: any, b: any) => {
        const aMatch = productTitleMatchesKeywords(a);
        const bMatch = productTitleMatchesKeywords(b);
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      })
      .slice(0, 20); // Limit to 20

    const newProductsRaw = (newResponse as { data?: unknown[] })?.data || [];
    const newProducts = (newProductsRaw as unknown[]).filter(productHasStock).slice(0, 20);

    // Filter for favorite products (by rating)
    const favoriteProducts = [...availableProducts]
      .sort((a: any, b: any) => {
        const ratingA = parseFloat(a.attributes.AverageRating) || 0;
        const ratingB = parseFloat(b.attributes.AverageRating) || 0;
        return ratingB - ratingA; // Highest rating first
      })
      .slice(0, 20);

    logger.info(`[BatchHomepage] Split into: ${discountedProducts.length} discounted, ${newProducts.length} new (title contains G), ${favoriteProducts.length} favorites`);

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
 * Fetch top-rated products for a specific category on homepage.
 */
export const getFeaturedCategoryProductsByRating = async (
  categorySlug: string,
  limit: number = 6,
): Promise<ProductCardProps[]> => {
  const normalizedSlug = categorySlug.trim();
  if (!normalizedSlug) return [];

  const params = new URLSearchParams();
  params.append("filters[Status][$eq]", "Active");
  params.append("filters[removedAt][$null]", "true");
  params.append("filters[product_main_category][Slug][$eq]", normalizedSlug);
  params.append("filters[product_variations][Price][$gte]", "1");
  params.append("filters[product_variations][product_stock][Count][$gt]", "0");
  params.append("sort[0]", "AverageRating:desc");
  params.append("pagination[limit]", String(limit));
  params.append("pagination[withCount]", "false");
  params.append("populate[0]", "CoverImage");
  params.append("populate[1]", "product_main_category");
  params.append("populate[2]", "product_variations");
  params.append("populate[3]", "product_variations.product_stock");
  params.append("populate[4]", "product_variations.general_discounts");
  params.append("populate[5]", "product_variations.product_variation_color");
  params.append("fields[0]", "Title");
  params.append("fields[1]", "Slug");
  params.append("fields[2]", "Status");
  params.append("fields[3]", "AverageRating");

  const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}?${params.toString()}`;

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      next: { revalidate: 60 },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }).then((res) => res.json());

    const allProducts = (response as any)?.data || [];
    const availableProducts = allProducts.filter(productHasStock);
    return formatProductsToCardProps(availableProducts).slice(0, limit);
  } catch (error) {
    logger.error("[Homepage] Error fetching featured category products:", error as any);
    return [];
  }
};

/**
 * Fetch products that have active discounts.
 */
export const getDiscountedProducts = async (): Promise<ProductCardProps[]> => {
  const endpoint =
    `${ENDPOINTS.PRODUCT.PRODUCT}?filters[Status][$eq]=Active&` +
    `filters[removedAt][$null]=true&` +
    `${HOMEPAGE_PRODUCT_POPULATE}&` +
    `${PRODUCT_COMMON_FIELDS}&` +
    `filters[product_variations][Price][$gte]=1&` +
    `filters[product_variations][product_stock][Count][$gt]=0&` +
    `pagination[limit]=20&` +
    `pagination[withCount]=false`;

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
        if (variation?.attributes?.IsPublished !== true) return false;
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
    `filters[removedAt][$null]=true&` +
    `${HOMEPAGE_PRODUCT_POPULATE}&` +
    `${PRODUCT_COMMON_FIELDS}&` +
    `filters[product_variations][Price][$gte]=1&` +
    `filters[product_variations][product_stock][Count][$gt]=0&` +
    `sort[0]=createdAt:desc&` +
    `pagination[limit]=20&` +
    `pagination[withCount]=false`;


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
    `filters[removedAt][$null]=true&` +
    `${HOMEPAGE_PRODUCT_POPULATE}&` +
    `${PRODUCT_COMMON_FIELDS}&` +
    `filters[product_variations][Price][$gte]=1&` +
    `filters[product_variations][product_stock][Count][$gt]=0&` +
    `sort[0]=AverageRating:desc&` +
    `pagination[limit]=20&` +
    `pagination[withCount]=false`;

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
      `filters[removedAt][$null]=true&` +
      `${HOMEPAGE_PRODUCT_POPULATE}&` +
      `${PRODUCT_COMMON_FIELDS}&` +
      // Hide zero-price variations
      `filters[product_variations][Price][$gte]=1&` +
      `filters[product_variations][product_stock][Count][$gt]=0&` +
      `pagination[limit]=${poolSize}&` +
      `pagination[withCount]=false`;


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
