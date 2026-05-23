import { apiClient } from "@/services";
import { ENDPOINTS, getStrapiServerUrl } from "@/constants/api";
import { buildTitleKeywordFilter } from "@/constants/productKeywords";
import type { ProductCardProps } from "@/components/Product/Card";
import { formatProductsToCardProps } from "./product";
import { productTitleMatchesKeywords } from "@/utils/product";
import logger from "@/utils/logger";
import { getPublicSuperAdminSettings } from "@/services/super-admin/settings/public";

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
    "Accept-Encoding": "gzip", // Explicitly request compression
  },
};

/**
 * Fetch products by IDs with the same populate/fields as homepage sections.
 * Returns products in the same order as the requested ids (Strapi order is undefined).
 */
export const getProductsByIds = async (ids: number[]): Promise<ProductCardProps[]> => {
  if (ids.length === 0) return [];
  const idParams = ids.map((id, i) => `filters[id][$in][${i}]=${id}`).join("&");
  const endpoint =
    `${ENDPOINTS.PRODUCT.PRODUCT}?${idParams}&` +
    `filters[Status][$eq]=Active&` +
    `filters[removedAt][$null]=true&` +
    `${HOMEPAGE_PRODUCT_POPULATE}&` +
    `${PRODUCT_COMMON_FIELDS}&` +
    `filters[product_variations][Price][$gte]=1&` +
    `filters[product_variations][product_stock][Count][$gt]=0&` +
    `pagination[limit]=${Math.max(ids.length, 20)}&` +
    `pagination[withCount]=false`;
  try {
    const response = await fetch(`${getStrapiServerUrl()}${endpoint}`, HOMEPAGE_FETCH_OPTIONS).then((res) =>
      res.json(),
    );
    const rawList = (response as { data?: unknown[] })?.data ?? [];
    const withStock = (rawList as unknown[]).filter(productHasStock);
    const idToIndex = new Map(ids.map((id, i) => [id, i]));
    const sorted = [...withStock].sort((a: any, b: any) => {
      const aIdx = idToIndex.get(Number(a?.id ?? 0)) ?? 999;
      const bIdx = idToIndex.get(Number(b?.id ?? 0)) ?? 999;
      return aIdx - bIdx;
    });
    return formatProductsToCardProps(sorted);
  } catch (error) {
    logger.error("[Homepage] getProductsByIds error:", error as any);
    return [];
  }
};

/**
 * Fetch homepage product sections: batch for discounted + favorites, separate request for "new" (title matches PRODUCT_BOOST_KEYWORDS).
 * If settings contain curated product IDs (homeNewestProductIds, homeDiscountedProductIds), those are used instead of algorithmic selection.
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
    // Start settings fetch and default batch fetch in parallel (eliminates waterfall)
    const settingsPromise = getPublicSuperAdminSettings();
    const batchPromise = fetch(`${getStrapiServerUrl()}${batchEndpoint}`, HOMEPAGE_FETCH_OPTIONS)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          logger.error("[Homepage] Batch products API error", {
            status: res.status,
            error: (data as { error?: { message?: string } })?.error?.message ?? data,
          });
          return { data: [] };
        }
        return data as { data?: unknown[] };
      });

    // Wait for settings to determine strategy for "new" and "discounted" sections
    const settings = await settingsPromise;
    const curatedNewest = settings.homeNewestProductIds.length > 0;
    const curatedDiscounted = settings.homeDiscountedProductIds.length > 0;

    // Start new products and curated discounted fetches in parallel
    const newPromise = curatedNewest
      ? getProductsByIds(settings.homeNewestProductIds)
      : fetch(`${getStrapiServerUrl()}${newEndpoint}`, HOMEPAGE_FETCH_OPTIONS)
          .then(async (res) => {
            const data = await res.json();
            if (!res.ok) {
              logger.error("[Homepage] New products API error", {
                status: res.status,
                error: (data as { error?: { message?: string } })?.error?.message ?? data,
              });
              return { data: [] };
            }
            return data as { data?: unknown[] };
          })
          .then((newResponse: { data?: unknown[] }) => {
            const raw = newResponse?.data ?? [];
            return formatProductsToCardProps(
              (raw as unknown[]).filter(productHasStock).slice(0, 20),
            );
          });
    const discountedCuratedPromise = curatedDiscounted
      ? getProductsByIds(settings.homeDiscountedProductIds)
      : Promise.resolve<ProductCardProps[] | null>(null);

    // Wait for all fetches to complete
    const [batchResponse, newProducts, discountedCurated] = await Promise.all([
      batchPromise,
      newPromise,
      discountedCuratedPromise,
    ]);

    const allProducts = (batchResponse as { data?: unknown[] })?.data ?? [];
    const availableProducts = allProducts.filter(productHasStock);
    logger.info(`[BatchHomepage] Fetched ${allProducts.length} total products for discounted/favorites`);

    let discounted: ProductCardProps[];
    if (discountedCurated && discountedCurated.length > 0) {
      discounted = discountedCurated;
    } else {
      const discountedProducts = availableProducts
        .filter((product: any) => {
          const variations = product?.attributes?.product_variations;
          const data = variations?.data;
          if (!Array.isArray(data)) return false;
          return data.some((variation: any) => {
            const stockCount = variation.attributes?.product_stock?.data?.attributes?.Count;
            const hasStock = typeof stockCount === "number" && stockCount > 0;
            if (!hasStock) return false;
            const price = parseFloat(String(variation.attributes?.Price ?? 0));
            const generalDiscounts = variation.attributes?.general_discounts?.data;
            if (Array.isArray(generalDiscounts) && generalDiscounts.length > 0) return true;
            const discountPrice = variation.attributes?.DiscountPrice
              ? parseFloat(String(variation.attributes.DiscountPrice))
              : null;
            return discountPrice != null && discountPrice < price;
          });
        })
        .sort((a: any, b: any) => {
          const aMatch = productTitleMatchesKeywords(a);
          const bMatch = productTitleMatchesKeywords(b);
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
          return 0;
        })
        .slice(0, 20);
      discounted = formatProductsToCardProps(discountedProducts);
    }

    const favoriteProducts = [...availableProducts]
      .sort((a: any, b: any) => {
        const attrsA = a?.attributes;
        const attrsB = b?.attributes;
        const ratingA = parseFloat(String(attrsA?.AverageRating ?? 0)) || 0;
        const ratingB = parseFloat(String(attrsB?.AverageRating ?? 0)) || 0;
        return ratingB - ratingA;
      })
      .slice(0, 20);

    logger.info(
      `[BatchHomepage] Split into: ${discounted.length} discounted, ${newProducts.length} new, ${favoriteProducts.length} favorites`,
    );

    return {
      discounted,
      new: newProducts,
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
    const response = await fetch(`${getStrapiServerUrl()}${endpoint}`, {
      next: { revalidate: 60 },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip",
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
    const response = await fetch(`${getStrapiServerUrl()}${endpoint}`, {
      next: { revalidate: 60 }, // Revalidate every minute
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
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
    const response = await fetch(`${getStrapiServerUrl()}${endpoint}`, {
      next: { revalidate: 60 }, // Revalidate every minute
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
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
    const response = await fetch(`${getStrapiServerUrl()}${endpoint}`, {
      next: { revalidate: 60 }, // Revalidate every minute
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
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
