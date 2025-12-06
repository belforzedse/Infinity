export const revalidate = 30; // refresh product listing every 30 seconds

import { Suspense } from "react";
import PLPHeroBanner from "@/components/PLP/HeroBanner";
import PLPList from "@/components/PLP/List";
import PageContainer from "@/components/layout/PageContainer";
import ProductListSkeleton from "@/components/Skeletons/ProductListSkeleton";
import { API_BASE_URL, IMAGE_BASE_URL } from "@/constants/api";
import fetchWithTimeout from "@/utils/fetchWithTimeout";
import { searchProducts } from "@/services/product/search";
import logger from "@/utils/logger";
import type { Metadata } from "next";
import { CollectionPageSchema } from "@/components/SEO/CollectionPageSchema";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { computeDiscountForVariation } from "@/utils/discounts";

interface ProductVariation {
  attributes: {
    SKU: string;
    Price: string;
    IsPublished: boolean;
    DiscountPrice?: string;
    product_stock?: {
      data?: {
        attributes: {
          Count: number;
        };
      };
    };
    general_discounts?: {
      data: Array<{
        attributes: {
          Amount: number;
        };
      }>;
    };
  };
}

interface Product {
  id: number;
  attributes: {
    Title: string;
    Slug?: string;
    Description: string;
    Status: string;
    AverageRating: number | null;
    RatingCount: number | null;
    CoverImage: {
      data: {
        attributes: {
          url: string;
        };
      };
    };
    product_main_category: {
      data: {
        attributes: {
          Title: string;
          Slug: string;
        };
      };
    };
    product_variations: {
      data: ProductVariation[];
    };
  };
}

async function getProducts(
  category?: string,
  page = 1,
  pageSize = 30,
  showAvailableOnly = false,
  minPrice?: string,
  maxPrice?: string,
  size?: string,
  material?: string,
  season?: string,
  gender?: string,
  usage?: string,
  search?: string,
  sort?: string,
  hasDiscount?: boolean,
) {
  // Handle search queries differently
  if (search) {
    try {
      // Use the search service
      const searchResults = await searchProducts(search, page, pageSize);
      return {
        products: searchResults.data
          .filter((item) => {
            // Filter out products without images
            // CoverImage can be either ImageResponse (with url) or { data: ImageResponse | null }
            const coverImage = item.CoverImage;
            if (!coverImage) return false;

            // Check if it's the direct format (ImageResponse with url)
            if ('url' in coverImage && coverImage.url) return true;

            // Check if it's the nested format ({ data: ImageResponse | null })
            if ('data' in coverImage && coverImage.data?.url) return true;

            return false;
          })
          .map((item) => {
            // Transform search API format to match product data format
            // Extract url from either ImageResponse or { data: ImageResponse | null } format
            const coverImage = item.CoverImage;
            const imageUrl = coverImage && 'url' in coverImage
              ? coverImage.url
              : coverImage && 'data' in coverImage
                ? coverImage.data?.url
                : undefined;

            // Extract category title from either direct format or nested format
            const category = item.product_main_category;
            const categoryTitle = category && 'Title' in category
              ? category.Title
              : category && 'data' in category
                ? category.data?.attributes?.Title || ""
                : "";

            return {
              id: item.id,
              attributes: {
                Title: item.Title,
                Slug: (item as { Slug?: string }).Slug || undefined,
                Description: item.Description,
                Status: "Active",
                CoverImage: {
                  data: {
                    attributes: {
                      url: imageUrl,
                    },
                  },
                },
                product_main_category: {
                  data: {
                    attributes: {
                      Title: categoryTitle,
                      Slug: "",
                    },
                  },
                },
                product_variations: {
                  data: (item.product_variations && Array.isArray(item.product_variations)
                    ? item.product_variations
                    : item.product_variations && 'data' in item.product_variations
                      ? item.product_variations.data
                      : []
                  ).map((variation) => {
                    // Handle both direct variation and nested variation formats
                    const variationData = 'attributes' in variation ? variation.attributes : variation;
                    return {
                      attributes: {
                        SKU: "",
                        Price: variationData.Price.toString(),
                        DiscountPrice: variationData.DiscountPrice?.toString(),
                        IsPublished: true,
                      },
                    };
                  }),
                },
              },
            };
          }),
        pagination: {
          ...searchResults.meta.pagination,
          total: searchResults.meta.pagination.total,
        },
      };
    } catch (error) {
      logger.error("Error searching products", { error: String(error) });
      return {
        products: [],
        pagination: {
          page: 1,
          pageSize: pageSize,
          pageCount: 0,
          total: 0,
        },
      };
    }
  }

  // Build query parameters for regular product listing
  const baseUrl = `${API_BASE_URL}/products`;

  // Add required fields
  const queryParams = new URLSearchParams();
  queryParams.append("populate[0]", "CoverImage");
  queryParams.append("populate[1]", "product_main_category");
  queryParams.append("populate[2]", "product_variations");
  queryParams.append("populate[3]", "product_variations.product_stock");
  queryParams.append("populate[4]", "product_variations.general_discounts");
  queryParams.append("fields[0]", "Title");
  queryParams.append("fields[1]", "Slug");
  queryParams.append("fields[2]", "Description");
  queryParams.append("fields[3]", "Status");

  // Use API-level pagination to reduce payload size
  queryParams.append("pagination[page]", String(page));
  queryParams.append("pagination[pageSize]", String(pageSize));

  // Add filters
  queryParams.append("filters[Status][$eq]", "Active");
  queryParams.append("filters[removedAt][$null]", "true");

  // Filter for products with valid prices (Price > 0)
  // This ensures we only get products with at least one variation that has a price > 0
  // Note: We can't filter for CoverImage at API level (relations don't support $notNull in REST API)
  // So we still do a small post-fetch filter for images on the current page results
  queryParams.append("filters[product_variations][Price][$gt]", "0");

  // Category filter
  if (category) {
    queryParams.append("filters[product_main_category][Slug][$eq]", category);
  }

  // Price range filters (these will work in combination with the base Price > 0 filter)
  if (minPrice) {
    queryParams.append("filters[product_variations][Price][$gte]", minPrice);
  }
  if (maxPrice) {
    queryParams.append("filters[product_variations][Price][$lte]", maxPrice);
  }

  // Availability filter - check for actual stock (Count > 0) not just IsPublished
  if (showAvailableOnly) {
    queryParams.append("filters[product_variations][product_stock][Count][$gt]", "0");
  }

  // Size filter
  if (size) {
    queryParams.append("filters[product_variations][Size][$eq]", size);
  }

  // Material filter
  if (material) {
    queryParams.append("filters[product_variations][Material][$eq]", material);
  }

  // Season filter
  if (season) {
    queryParams.append("filters[product_variations][Season][$eq]", season);
  }

  // Gender filter
  if (gender) {
    queryParams.append("filters[product_variations][Gender][$eq]", gender);
  }

  // Usage filter
  if (usage) {
    queryParams.append("filters[product_variations][Usage][$eq]", usage);
  }

  // Apply API-level sorting when provided so pagination metadata stays accurate
  if (sort) {
    queryParams.append("sort[0]", sort);
  }

  // Apply discount filter when requested
  if (hasDiscount) {
    queryParams.append("filters[$or][0][product_variations][DiscountPrice][$gt]", "0");
    queryParams.append("filters[$or][1][product_variations][general_discounts][Amount][$gt]", "0");
  }

  // Construct final URL
  const url = `${baseUrl}?${queryParams.toString()}`;

  try {
    const response = await fetchWithTimeout(url, {
      timeoutMs: 15000,
      next: { revalidate: 60 },
    });
    const data = await response.json();

    const pagination = data?.meta?.pagination || {
      page,
      pageSize,
      pageCount: 0,
      total: 0,
    };

    const hasStock = (product: Product): boolean => {
      if (!product.attributes.product_variations?.data) return false;

      return product.attributes.product_variations.data.some((variation) => {
        if (!variation.attributes?.IsPublished) return false;

        const stockCount = variation.attributes?.product_stock?.data?.attributes?.Count;
        return typeof stockCount === "number" && stockCount > 0;
      });
    };

    // Post-fetch filtering: We filter for images here since API-level filtering for relations is limited
    const filteredProducts = (data?.data || []).filter((product: Product) => {
      const hasImage = !!(
        product.attributes.CoverImage?.data?.attributes?.url ||
        product.attributes.CoverImage?.data
      );

      if (!hasImage) {
        return false;
      }

      // Double-check valid price exists (API filter should handle this, but verify)
      const hasValidPrice = product.attributes.product_variations?.data?.some((variation) => {
        const price = variation.attributes.Price;
        return price && parseInt(price) > 0;
      });

      return hasValidPrice;
    });

    // Stock-priority sorting at the page level to avoid large payloads
    const stockFirstSorted = [...filteredProducts].sort((a: Product, b: Product) => {
      const aHasStock = hasStock(a);
      const bHasStock = hasStock(b);

      if (aHasStock && !bHasStock) return -1;
      if (!aHasStock && bHasStock) return 1;
      return 0;
    });

    // Frontend price sorting (applied after stock sorting on the current page)
    let products = stockFirstSorted;
    if (sort === "price:asc" || sort === "price:desc") {
      const getMinVariationPrice = (product: Product): number => {
        const variations = product.attributes.product_variations?.data || [];
        let minPrice = Infinity;

        for (const variation of variations) {
          if (!variation.attributes.IsPublished) continue;

          const discountResult = computeDiscountForVariation(variation as any);
          const finalPrice = discountResult?.finalPrice || parseFloat(variation.attributes.Price || "0");

          if (finalPrice > 0 && finalPrice < minPrice) {
            minPrice = finalPrice;
          }
        }

        return minPrice === Infinity ? 0 : minPrice;
      };

      products = [...stockFirstSorted].sort((a: Product, b: Product) => {
        const aHasStock = hasStock(a);
        const bHasStock = hasStock(b);

        if (aHasStock && !bHasStock) return -1;
        if (!aHasStock && bHasStock) return 1;

        const priceA = getMinVariationPrice(a);
        const priceB = getMinVariationPrice(b);
        return sort === "price:asc" ? priceA - priceB : priceB - priceA;
      });
    }

    return {
      products,
      pagination,
    };
  } catch (error) {
    logger.error("Error fetching products", { error: String(error) });
    return {
      products: [],
      pagination: {
        page: page,
        pageSize,
        pageCount: 0,
        total: 0,
      },
    };
  }
}

export default async function PLPPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await the searchParams object
  const params = await searchParams;

  // Extract parameters with default values
  const category = typeof params.category === "string" ? params.category : undefined;
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;
  const pageSize =
    typeof params.pageSize === "string" ? parseInt(params.pageSize) : 30;
  const showAvailableOnly =
    typeof params.available === "string" ? params.available === "true" : false;
  const minPrice = typeof params.minPrice === "string" ? params.minPrice : undefined;
  const maxPrice = typeof params.maxPrice === "string" ? params.maxPrice : undefined;
  const size = typeof params.size === "string" ? params.size : undefined;
  const material = typeof params.material === "string" ? params.material : undefined;
  const season = typeof params.season === "string" ? params.season : undefined;
  const gender = typeof params.gender === "string" ? params.gender : undefined;
  const usage = typeof params.usage === "string" ? params.usage : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;
  const sort = typeof params.sort === "string" ? params.sort : undefined;
  const hasDiscount =
    typeof params.hasDiscount === "string" ? params.hasDiscount === "true" : undefined;

  const { products, pagination } = await getProducts(
    category,
    page,
    pageSize,
    showAvailableOnly,
    minPrice,
    maxPrice,
    size,
    material,
    season,
    gender,
    usage,
    search,
    sort,
    hasDiscount,
  );

  // Determine if we're showing search results or category results
  const isSearchResults = !!search;

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://new.infinitycolor.co";
  const pageName = category
    ? `خرید ${category}`
    : search
      ? `نتایج جستجو برای "${search}"`
      : "فروشگاه";
  const SITE_NAME = "فروشگاه پوشاک اینفینیتی";
  const pageDescription = category
    ? `خرید ${category} با بهترین قیمت و ارسال سریع از ${SITE_NAME}`
    : search
      ? `نتایج جستجو برای «${search}» در ${SITE_NAME}`
      : `مشاهده و خرید انواع محصولات با بهترین قیمت در ${SITE_NAME}`;
  const pageUrl = category
    ? `${SITE_URL}/plp?category=${encodeURIComponent(category)}`
    : search
      ? `${SITE_URL}/plp?search=${encodeURIComponent(search)}`
      : `${SITE_URL}/plp`;

  // Map products to CollectionPageSchema format
  const collectionItems = products.slice(0, 20).map((product: Product) => {
    const variations = product.attributes.product_variations?.data || [];
    const prices = variations
      .map((v: ProductVariation) => {
        const price = parseFloat(v.attributes.Price || "0");
        const discountPrice = parseFloat(v.attributes.DiscountPrice || "0");
        return discountPrice > 0 ? discountPrice : price;
      })
      .filter((p: number) => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : undefined;
    const imageUrl = product.attributes.CoverImage?.data?.attributes?.url
      ? `${IMAGE_BASE_URL}${product.attributes.CoverImage.data.attributes.url}`
      : undefined;

    // Use slug if available, otherwise fall back to ID
    const productSlug = product.attributes.Slug || product.id.toString();

    return {
      id: product.id,
      title: product.attributes.Title,
      url: `/pdp/${productSlug}`,
      image: imageUrl,
      price: minPrice,
      currency: "IRR",
    };
  });

  return (
    <PageContainer variant="wide" className="space-y-6 pb-20 pt-6">
      {/* CollectionPage Schema for SEO */}
      {products.length > 0 && (
        <CollectionPageSchema
          name={pageName}
          description={pageDescription}
          url={pageUrl}
          items={collectionItems}
          itemCount={pagination.total}
        />
      )}

      {!isSearchResults && <PLPHeroBanner category={category} />}

      <Suspense fallback={<ProductListSkeleton />}>
        <PLPList
          products={products}
          pagination={pagination}
          category={category}
          searchQuery={search}
        />
      </Suspense>
    </PageContainer>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;

  const isSearch = !!search;
  const baseTitle = `فروشگاه | ${SITE_NAME}`;

  if (isSearch) {
    const q = search?.slice(0, 60) || "";
    const title = `نتایج جستجو برای "${q}" | ${SITE_NAME}`;
    const description = `مشاهده نتایج جستجو برای «${q}» در ${SITE_NAME}. جدیدترین و محبوب‌ترین محصولات.`;
    const canonicalUrl = `${SITE_URL}/plp${q ? `?search=${encodeURIComponent(q)}` : ""}`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        url: canonicalUrl,
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }

  if (category) {
    const title = `خرید ${category} | ${SITE_NAME}`;
    const description = `خرید ${category} با بهترین قیمت و ارسال سریع از ${SITE_NAME}. جدیدترین محصولات ${category}.`;
    const canonicalUrl = `${SITE_URL}/plp?category=${encodeURIComponent(category)}`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        url: canonicalUrl,
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }

  return {
    title: baseTitle,
    description: `مشاهده و خرید انواع محصولات با بهترین قیمت در ${SITE_NAME}.`,
    alternates: { canonical: `${SITE_URL}/plp` },
  };
}
