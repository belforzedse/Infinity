export const revalidate = 60; // balance freshness with server load

import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import PLPHeroBanner from "@/components/PLP/HeroBanner";
import PLPList from "@/components/PLP/List";
import PageContainer from "@/components/layout/PageContainer";
import ProductListSkeleton from "@/components/Skeletons/ProductListSkeleton";
import { API_BASE_URL, IMAGE_BASE_URL, getStrapiServerUrl } from "@/constants/api";
import fetchWithTimeout from "@/utils/fetchWithTimeout";
import { searchProducts } from "@/services/product/search";
import AsyncSidebarProducts from "@/components/PLP/List/AsyncSidebarProducts";
import logger from "@/utils/logger";
import type { Variation } from "@/types/Product";
import type { Metadata } from "next";
import { CollectionPageSchema } from "@/components/SEO/CollectionPageSchema";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { computeDiscountForVariation } from "@/utils/discounts";
import { productTitleHasG, getProductCreatedAt } from "@/utils/product";
import { validateCategorySlug } from "@/utils/category-validation";
import { getCategoryAndDescendantSlugs } from "@/utils/category-descendants";
import { getProductCategories } from "@/services/product/categories";
import type { PLPProduct } from "@/components/PLP/types";

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
      data: Variation[];
    };
  };
}

async function getProducts(
  categorySlugs?: string[],
  page = 1,
  pageSize = 30, // Reduced page size for better performance
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
      const normalizeRelation = (rel: any, isVariation = false): any => {
        if (!rel) return null;
        if (typeof rel === "object" && "data" in rel) return rel;

        if (Array.isArray(rel)) {
          return {
            data: rel
              .map((item: any) => {
                if (!item) return null;
                if (item.attributes) {
                  if (isVariation) {
                    const {
                      product_stock,
                      product_variation_color,
                      product_variation_size,
                      product_variation_model,
                      general_discounts,
                      ...rest
                    } = item.attributes;
                    return {
                      ...item,
                      attributes: {
                        ...rest,
                        product_stock: normalizeRelation(product_stock),
                        product_variation_color: normalizeRelation(product_variation_color),
                        product_variation_size: normalizeRelation(product_variation_size),
                        product_variation_model: normalizeRelation(product_variation_model),
                        general_discounts: normalizeRelation(general_discounts),
                      },
                    };
                  }
                  return item;
                }
                const {
                  id,
                  product_stock,
                  product_variation_color,
                  product_variation_size,
                  product_variation_model,
                  general_discounts,
                  ...rest
                } = item;
                const normalized: any = { id, attributes: rest };
                if (isVariation) {
                  normalized.attributes.product_stock = normalizeRelation(product_stock);
                  normalized.attributes.product_variation_color =
                    normalizeRelation(product_variation_color);
                  normalized.attributes.product_variation_size =
                    normalizeRelation(product_variation_size);
                  normalized.attributes.product_variation_model =
                    normalizeRelation(product_variation_model);
                  normalized.attributes.general_discounts =
                    normalizeRelation(general_discounts);
                }
                return normalized;
              })
              .filter(Boolean),
          };
        }

        if (rel.id !== undefined) {
          const { id, ...rest } = rel;
          return {
            data: { id, attributes: rest },
          };
        }

        return null;
      };

      const normalizeSearchProduct = (raw: any): Product | null => {
        if (!raw) return null;
        if (raw.attributes) {
          return {
            ...raw,
            attributes: {
              ...raw.attributes,
              product_main_category: normalizeRelation(raw.attributes.product_main_category),
              product_variations: normalizeRelation(raw.attributes.product_variations, true),
              CoverImage: normalizeRelation(raw.attributes.CoverImage),
            },
          } as Product;
        }

        const { id, product_main_category, product_variations, CoverImage, ...rest } = raw;
        return {
          id,
          attributes: {
            ...rest,
            product_main_category: normalizeRelation(product_main_category),
            product_variations: normalizeRelation(product_variations, true),
            CoverImage: normalizeRelation(CoverImage),
          },
        } as Product;
      };

      // Use the search service
      const searchResults = await searchProducts(search, page, pageSize);
      const normalizedProducts = (searchResults.data || [])
        .map(normalizeSearchProduct)
        .filter((product): product is Product => Boolean(product))
        .filter(
          (product) =>
            !!(
              product.attributes?.CoverImage?.data?.attributes?.url ||
              product.attributes?.CoverImage?.data
            ),
        );
      return {
        products: normalizedProducts,
        pagination: {
          page: searchResults.meta?.pagination?.page ?? page,
          pageSize: searchResults.meta?.pagination?.pageSize ?? pageSize,
          pageCount: searchResults.meta?.pagination?.pageCount ?? 0,
          total: searchResults.meta?.pagination?.total ?? normalizedProducts.length,
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
  // Use internal URL for server-side fetches to bypass TLS/DNS (50-200ms faster)
  const strapiBase = getStrapiServerUrl();
  const baseUrl = `${strapiBase}/products`;

  // Add required fields
  const queryParams = new URLSearchParams();
  queryParams.append("populate[0]", "CoverImage");
  queryParams.append("populate[1]", "product_main_category");
  queryParams.append("populate[2]", "product_variations");
  queryParams.append("populate[3]", "product_variations.product_stock");
  queryParams.append("populate[4]", "product_variations.general_discounts");
  queryParams.append("populate[5]", "product_variations.product_variation_color");
  queryParams.append("fields[0]", "Title");
  queryParams.append("fields[1]", "Slug");
  queryParams.append("fields[2]", "Description");
  queryParams.append("fields[3]", "Status");
  queryParams.append("fields[4]", "createdAt");

  // API pagination: one page per request for performance (no 500-product fetch).
  queryParams.append("pagination[page]", String(page));
  queryParams.append("pagination[pageSize]", String(pageSize));

  // Add filters
  queryParams.append("filters[Status][$eq]", "Active");
  queryParams.append("filters[removedAt][$null]", "true");

  // Filter for products with valid prices (Price > 0)
  // This ensures we only get products with at least one variation that has a price > 0
  // Note: We can't filter for CoverImage at API level (relations don't support $notNull in REST API)
  // So we do post-fetch filtering for images, which is why we fetch more products (60) than we display
  queryParams.append("filters[product_variations][Price][$gt]", "0");

  // Category filter: parent + all descendants (e.g. شال + روسری ابریشم). categorySlugs is built via getCategoryAndDescendantSlugs.
  if (categorySlugs && categorySlugs.length > 0) {
    categorySlugs.forEach((slug, i) => {
      queryParams.append(`filters[product_main_category][Slug][$in][${i}]`, slug);
    });
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

  // Server-side sort where supported (price sort remains in-memory on current page only).
  if (sort && sort !== "price:asc" && sort !== "price:desc") {
    queryParams.append("sort[0]", sort);
  }

  // Construct final URL (internal first; fallback to public API if unreachable)
  const queryString = queryParams.toString();
  const url = `${baseUrl}?${queryString}`;
  const fallbackUrl = `${API_BASE_URL}/products?${queryString}`;

  let response: Response;
  let data: { data?: unknown[]; meta?: { pagination?: { total?: number; pageCount?: number } } };
  try {
    response = await fetchWithTimeout(url, {
      timeoutMs: 15000,
      next: { revalidate: 60 },
    });
    data = await response.json();
  } catch (firstErr) {
    logger.warn("[PLP] Products fetch failed (internal URL?), retrying with public API", {
      error: String(firstErr),
      urlHint: baseUrl.replace(/\?.*/, ""),
    });
    try {
      response = await fetchWithTimeout(fallbackUrl, {
        timeoutMs: 15000,
        next: { revalidate: 60 },
      });
      data = await response.json();
    } catch (secondErr) {
      logger.error("[PLP] Products fetch failed (public fallback)", { error: String(secondErr) });
      return {
        products: [],
        pagination: { page, pageSize, pageCount: 0, total: 0 },
      };
    }
  }

  if (!response.ok) {
    logger.error("[PLP] Products API error", {
      status: response.status,
      url: (response.url || url).replace(/\?.*/, "?…"),
      error: (data as { error?: { message?: string } })?.error?.message ?? String(data),
    });
    return {
      products: [],
      pagination: { page, pageSize, pageCount: 0, total: 0 },
    };
  }

  try {
    const rawProducts = (Array.isArray(data?.data) ? data.data : []) as Product[];
    // Post-fetch filtering: We filter for images here since API-level filtering for relations is limited
    // Price filtering is done at API level, but we double-check for edge cases
    let filteredProducts = rawProducts.filter((product: Product) => {
      // Filter out products without images (can't filter at API level for relations)
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
        return price && Number(price) > 0;
      });

      if (!hasValidPrice) {
        return false;
      }

      // If showAvailableOnly is true, check if any variation has stock
      // (This can't be easily done at API level due to relation complexity)
      if (showAvailableOnly) {
        const hasAvailableVariation = product.attributes.product_variations?.data?.some((variation) => {
          const stockCount = variation.attributes.product_stock?.data?.attributes?.Count;
          return typeof stockCount === "number" && stockCount > 0;
        });
        return hasAvailableVariation;
      }

      // If hasDiscount (تخفیف های وسوسه انگیز), filter to discounted products only
      if (hasDiscount) {
        const hasDiscountedVariation = product.attributes.product_variations?.data?.some((variation: any) => {
          if (!variation?.attributes?.IsPublished) return false;
          const stockCount = variation.attributes.product_stock?.data?.attributes?.Count;
          if (typeof stockCount !== "number" || stockCount <= 0) return false;
          const price = parseFloat(variation.attributes.Price || "0");
          const generalDiscounts = variation.attributes.general_discounts?.data;
          if (generalDiscounts && generalDiscounts.length > 0) return true;
          const discountPrice = variation.attributes.DiscountPrice
            ? parseFloat(variation.attributes.DiscountPrice)
            : null;
          return discountPrice !== null && discountPrice < price;
        });
        if (!hasDiscountedVariation) return false;
      }

      return true;
    });

    // Light in-memory sort only for current page (API already applied sort for createdAt etc.).
    // Stock-first and "G" title ordering for newest/discount; price sort for price:asc/desc.
    const hasStock = (product: Product): boolean => {
      if (!product.attributes.product_variations?.data) return false;
      return product.attributes.product_variations.data.some((variation) => {
        if (!variation.attributes?.IsPublished) return false;
        const stockCount = variation.attributes?.product_stock?.data?.attributes?.Count;
        return typeof stockCount === "number" && stockCount > 0;
      });
    };

    filteredProducts.sort((a: Product, b: Product) => {
      const aHasStock = hasStock(a);
      const bHasStock = hasStock(b);
      if (sort === "createdAt:desc") {
        const aHasG = productTitleHasG(a);
        const bHasG = productTitleHasG(b);
        if (aHasG && !bHasG) return -1;
        if (!aHasG && bHasG) return 1;
        if (aHasStock && !bHasStock) return -1;
        if (!aHasStock && bHasStock) return 1;
        return getProductCreatedAt(b) - getProductCreatedAt(a);
      }
      if (hasDiscount) {
        const aHasG = productTitleHasG(a);
        const bHasG = productTitleHasG(b);
        if (aHasG && !bHasG) return -1;
        if (!aHasG && bHasG) return 1;
      }
      if (aHasStock && !bHasStock) return -1;
      if (!aHasStock && bHasStock) return 1;
      return 0;
    });

    if (sort === "price:asc" || sort === "price:desc") {
      const getMinVariationPrice = (product: Product): number => {
        const variations = product.attributes.product_variations?.data || [];
        let minPrice = Infinity;
        for (const variation of variations) {
          if (!variation.attributes.IsPublished) continue;
          const stockCount = variation.attributes.product_stock?.data?.attributes?.Count;
          if (typeof stockCount === "number" && stockCount <= 0) continue;
          const discountResult = computeDiscountForVariation(variation.attributes);
          const finalPrice = discountResult?.finalPrice || Number(variation.attributes.Price) || 0;
          if (finalPrice > 0 && finalPrice < minPrice) minPrice = finalPrice;
        }
        return minPrice === Infinity ? 0 : minPrice;
      };
      filteredProducts.sort((a: Product, b: Product) => {
        const aHasStock = hasStock(a);
        const bHasStock = hasStock(b);
        if (aHasStock && !bHasStock) return -1;
        if (!aHasStock && bHasStock) return 1;
        const priceA = getMinVariationPrice(a);
        const priceB = getMinVariationPrice(b);
        return sort === "price:asc" ? priceA - priceB : priceB - priceA;
      });
    }

    if (rawProducts.length > 0 && filteredProducts.length === 0) {
      logger.warn("[PLP] All products filtered out (e.g. no CoverImage or valid price)", {
        rawCount: rawProducts.length,
        categorySlugs: categorySlugs?.slice(0, 3),
      });
    }

    const meta = data.meta?.pagination;
    const total = typeof meta?.total === "number" ? meta.total : filteredProducts.length;
    const pageCount = typeof meta?.pageCount === "number" ? meta.pageCount : Math.ceil(total / pageSize);

    return {
      products: filteredProducts,
      pagination: {
        page: page,
        pageSize: pageSize,
        pageCount,
        total,
      },
    };
  } catch (error) {
    logger.error("[PLP] Error parsing or filtering products", { error: String(error) });
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
  // Ensure env (e.g. STRAPI_INTERNAL_URL) is read at request time, not build time (Next.js 16)
  await connection();
  const params = await searchParams;

  // Extract parameters with default values
  const category = typeof params.category === "string" ? params.category : undefined;
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;
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

  // Validate category if provided - return 404 for invalid categories
  // Use the validated category slug to ensure we use the canonical slug (no trailing slashes)
  let validatedCategory = category;
  let categoryTitle: string | undefined = undefined;
  if (category && !search) {
    // First sanitize the category slug to reject obviously invalid ones
    // This prevents database lookups for gibberish categories
    const categoryData = await validateCategorySlug(category);
    if (!categoryData) {
      logger.warn(`[PLP] Invalid or non-existent category requested: ${category}`);
      // Return 404 for invalid categories to prevent indexing
      notFound();
    }
    // Use the canonical slug from the validated category data
    validatedCategory = categoryData.attributes.Slug;
    // Store the category title for display
    categoryTitle = categoryData.attributes.Title;
  }

  // Fetch full category tree (parent + children) when a category filter is present so product list includes parent and all descendants.
  const allCategories = validatedCategory
    ? await getProductCategories({ revalidate: 3600 })
    : [];
  const categorySlugs =
    validatedCategory && allCategories.length > 0
      ? getCategoryAndDescendantSlugs(allCategories, validatedCategory)
      : validatedCategory
        ? [validatedCategory]
        : undefined;

  const { products, pagination } = await getProducts(
    categorySlugs,
    page,
    30,
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

  // Sidebar is loaded in a Suspense boundary so main PLP content is not blocked by getHomepageSections().
  const sidebarSlot = (
    <Suspense
      fallback={
        <div className="flex flex-col gap-7">
          <div className="h-20 animate-pulse rounded bg-slate-100" />
          <div className="h-20 animate-pulse rounded bg-slate-100" />
        </div>
      }
    >
      <AsyncSidebarProducts />
    </Suspense>
  );

  // Determine if we're showing search results or category results
  const isSearchResults = !!search;

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://new.infinitycolor.co";
  const SITE_NAME = "فروشگاه پوشاک اینفینیتی";
  // Use category title if available, fallback to slug
  const displayCategoryName = categoryTitle || validatedCategory;
  const pageName = validatedCategory
    ? `خرید ${displayCategoryName}`
    : search
      ? `نتایج جستجو برای "${search}"`
      : "فروشگاه";
  const pageDescription = validatedCategory
    ? `خرید ${displayCategoryName} با بهترین قیمت و ارسال سریع از ${SITE_NAME}`
    : search
      ? `نتایج جستجو برای «${search}» در ${SITE_NAME}`
      : `مشاهده و خرید انواع محصولات با بهترین قیمت در ${SITE_NAME}`;
  const pageUrl = validatedCategory
    ? `${SITE_URL}/plp?category=${encodeURIComponent(validatedCategory)}`
    : search
      ? `${SITE_URL}/plp?search=${encodeURIComponent(search)}`
      : `${SITE_URL}/plp`;

  // Map products to CollectionPageSchema format
  const collectionItems = products.slice(0, 20).map((product: Product) => {
    const variations = product.attributes.product_variations?.data || [];
    const prices = variations
      .map((v: Variation) => {
        const price = parseFloat(String(v.attributes.Price || "0"));
        const discountPrice = parseFloat(String(v.attributes.DiscountPrice || "0"));
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

      {!isSearchResults && <PLPHeroBanner category={validatedCategory} />}

      <Suspense fallback={<ProductListSkeleton />}>
        <PLPList
          products={products as PLPProduct[]}
          pagination={pagination}
          category={validatedCategory}
          allCategories={allCategories}
          searchQuery={search}
          sidebarSlot={sidebarSlot}
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
    // Validate category - if invalid, return noindex metadata as defense-in-depth
    const categoryData = await validateCategorySlug(category);

    if (!categoryData) {
      // Invalid category - return noindex metadata (though page should return 404)
      logger.warn(`[Metadata] Invalid category in metadata generation: ${category}`);
      return {
        title: baseTitle,
        description: `مشاهده و خرید انواع محصولات با بهترین قیمت در ${SITE_NAME}.`,
        robots: {
          index: false,
          follow: false,
        },
        alternates: { canonical: `${SITE_URL}/plp` },
      };
    }

    // Use the validated category title for better SEO
    const categoryTitle = categoryData.attributes.Title || category;
    const title = `خرید ${categoryTitle} | ${SITE_NAME}`;
    const description = `خرید ${categoryTitle} با بهترین قیمت و ارسال سریع از ${SITE_NAME}. جدیدترین محصولات ${categoryTitle}.`;
    const canonicalUrl = `${SITE_URL}/plp?category=${encodeURIComponent(categoryData.attributes.Slug)}`;
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
