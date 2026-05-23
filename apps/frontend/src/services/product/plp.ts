import type { Metadata } from "next";
import { IMAGE_BASE_URL, getStrapiServerUrl } from "@/constants/api";
import { SITE_NAME, SITE_URL } from "@/config/site";
import type { PLPPagination } from "@/components/PLP/types";
import type { Variation } from "@/types/Product";
import { computeDiscountForVariation } from "@/utils/discounts";
import fetchWithTimeout from "@/utils/fetchWithTimeout";
import logger from "@/utils/logger";
import { getProductCreatedAt, productTitleHasG } from "@/utils/product";
import { getCategoryAndDescendantSlugs } from "@/utils/category-descendants";
import { getValidatedCategoryCached, type CategoryData } from "@/utils/category-validation";
import { getCategoryPlpHref } from "@/utils/plpRoutes";
import { getProductCategories, type ProductCategorySummary } from "./categories";

export interface PLPProduct {
  id: number;
  attributes: {
    Title: string;
    Slug?: string;
    Description?: string;
    Status?: string;
    AverageRating?: number | null;
    RatingCount?: number | null;
    SeenCount?: number | null;
    createdAt?: string;
    CoverImage?: {
      data?: {
        attributes?: {
          url?: string;
        };
      } | null;
    };
    product_main_category?: {
      data?: {
        attributes?: {
          Title?: string;
          Slug?: string;
        };
      } | null;
    };
    product_variations?: {
      data?: Variation[];
    };
  };
}

export interface PLPQuery {
  category?: string;
  page: number;
  available: boolean;
  minPrice?: string;
  maxPrice?: string;
  size?: string;
  material?: string;
  season?: string;
  gender?: string;
  usage?: string;
  search?: string;
  sort?: string;
  hasDiscount?: boolean;
}

export interface PLPCategoryContext {
  data: CategoryData;
  slug: string;
  title: string;
  allCategories: ProductCategorySummary[];
  categorySlugs: string[];
}

export interface PLPProductsResult {
  products: PLPProduct[];
  pagination: PLPPagination;
}

export function parsePLPQuery(params: { [key: string]: string | string[] | undefined }): PLPQuery {
  return {
    category: typeof params.category === "string" ? params.category : undefined,
    page: typeof params.page === "string" ? parseInt(params.page, 10) || 1 : 1,
    available: typeof params.available === "string" ? params.available === "true" : false,
    minPrice: typeof params.minPrice === "string" ? params.minPrice : undefined,
    maxPrice: typeof params.maxPrice === "string" ? params.maxPrice : undefined,
    size: typeof params.size === "string" ? params.size : undefined,
    material: typeof params.material === "string" ? params.material : undefined,
    season: typeof params.season === "string" ? params.season : undefined,
    gender: typeof params.gender === "string" ? params.gender : undefined,
    usage: typeof params.usage === "string" ? params.usage : undefined,
    search: typeof params.search === "string" ? params.search : undefined,
    sort: typeof params.sort === "string" ? params.sort : undefined,
    hasDiscount:
      typeof params.hasDiscount === "string" ? params.hasDiscount === "true" : undefined,
  };
}

export async function getPLPCategoryContext(
  slug: string | undefined,
): Promise<PLPCategoryContext | null> {
  if (!slug) return null;

  const categoryData = await getValidatedCategoryCached(slug);
  if (!categoryData) return null;

  const allCategories = await getProductCategories({ revalidate: 3600 });
  const resolvedSlug = categoryData.attributes.Slug;
  const descendantSlugs =
    allCategories.length > 0
      ? getCategoryAndDescendantSlugs(allCategories, resolvedSlug)
      : [];

  return {
    data: categoryData,
    slug: resolvedSlug,
    title: categoryData.attributes.Title || resolvedSlug,
    allCategories,
    categorySlugs: descendantSlugs.length > 0 ? descendantSlugs : [resolvedSlug],
  };
}

function normalizeRelation(rel: any, isVariation = false): any {
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
            normalized.attributes.product_variation_color = normalizeRelation(product_variation_color);
            normalized.attributes.product_variation_size = normalizeRelation(product_variation_size);
            normalized.attributes.product_variation_model = normalizeRelation(product_variation_model);
            normalized.attributes.general_discounts = normalizeRelation(general_discounts);
          }
          return normalized;
        })
        .filter(Boolean),
    };
  }

  if (rel.id !== undefined) {
    const { id, ...rest } = rel;
    return { data: { id, attributes: rest } };
  }

  return null;
}

function normalizeProduct(raw: any): PLPProduct | null {
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
    } as PLPProduct;
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
  } as PLPProduct;
}

function hasImage(product: PLPProduct): boolean {
  return !!(
    product.attributes.CoverImage?.data?.attributes?.url ||
    product.attributes.CoverImage?.data
  );
}

function hasValidPrice(product: PLPProduct): boolean {
  return Boolean(
    product.attributes.product_variations?.data?.some((variation) => {
      const price = variation.attributes.Price;
      return price && Number(price) > 0;
    }),
  );
}

function hasStock(product: PLPProduct): boolean {
  return Boolean(
    product.attributes.product_variations?.data?.some((variation) => {
      if (!variation.attributes?.IsPublished) return false;
      const stockCount = variation.attributes.product_stock?.data?.attributes?.Count;
      return typeof stockCount === "number" && stockCount > 0;
    }),
  );
}

function hasDiscountedVariation(product: PLPProduct): boolean {
  return Boolean(
    product.attributes.product_variations?.data?.some((variation: any) => {
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
    }),
  );
}

function getMinVariationPrice(product: PLPProduct): number {
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
}

export async function getPLPProducts(
  query: PLPQuery,
  categorySlugs?: string[],
  pageSize = 30,
): Promise<PLPProductsResult> {
  const strapiBase = getStrapiServerUrl();
  const baseUrl = `${strapiBase}/products`;
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
  queryParams.append("fields[5]", "SeenCount");
  queryParams.append("pagination[page]", String(query.page));
  queryParams.append("pagination[pageSize]", String(pageSize));
  queryParams.append("filters[Status][$eq]", "Active");
  queryParams.append("filters[removedAt][$null]", "true");
  queryParams.append("filters[product_variations][Price][$gt]", "0");

  if (categorySlugs && categorySlugs.length > 0) {
    categorySlugs.forEach((slug, i) => {
      queryParams.append(`filters[product_main_category][Slug][$in][${i}]`, slug);
    });
  }

  if (query.search) {
    queryParams.append("filters[$or][0][Title][$containsi]", query.search);
    queryParams.append("filters[$or][1][Description][$containsi]", query.search);
  }

  if (query.minPrice) {
    queryParams.append("filters[product_variations][Price][$gte]", query.minPrice);
  }
  if (query.maxPrice) {
    queryParams.append("filters[product_variations][Price][$lte]", query.maxPrice);
  }
  if (query.available) {
    queryParams.append("filters[product_variations][product_stock][Count][$gt]", "0");
  }
  if (query.size) {
    queryParams.append("filters[product_variations][Size][$eq]", query.size);
  }
  if (query.material) {
    queryParams.append("filters[product_variations][Material][$eq]", query.material);
  }
  if (query.season) {
    queryParams.append("filters[product_variations][Season][$eq]", query.season);
  }
  if (query.gender) {
    queryParams.append("filters[product_variations][Gender][$eq]", query.gender);
  }
  if (query.usage) {
    queryParams.append("filters[product_variations][Usage][$eq]", query.usage);
  }
  if (query.sort && query.sort !== "price:asc" && query.sort !== "price:desc") {
    queryParams.append("sort[0]", query.sort);
  }

  const url = `${baseUrl}?${queryParams.toString()}`;
  let response: Response;
  let data: { data?: unknown[]; meta?: { pagination?: { total?: number; pageCount?: number } } };

  try {
    response = await fetchWithTimeout(url, {
      timeoutMs: 15000,
      next: { revalidate: 120 },
    });
    data = await response.json();
  } catch (error) {
    logger.error("[PLP] Products fetch failed", {
      error: String(error),
      urlHint: baseUrl,
    });
    return { products: [], pagination: { page: query.page, pageSize, pageCount: 0, total: 0 } };
  }

  if (!response.ok) {
    logger.error("[PLP] Products API error", {
      status: response.status,
      url: (response.url || url).replace(/\?.*/, "?..."),
      error: (data as { error?: { message?: string } })?.error?.message ?? String(data),
    });
    return { products: [], pagination: { page: query.page, pageSize, pageCount: 0, total: 0 } };
  }

  try {
    const rawProducts = (Array.isArray(data?.data) ? data.data : [])
      .map(normalizeProduct)
      .filter((product): product is PLPProduct => Boolean(product));

    const filteredProducts = rawProducts.filter((product) => {
      if (!hasImage(product)) return false;
      if (!hasValidPrice(product)) return false;
      if (query.available && !hasStock(product)) return false;
      if (query.hasDiscount && !hasDiscountedVariation(product)) return false;
      return true;
    });

    filteredProducts.sort((a, b) => {
      const aHasStock = hasStock(a);
      const bHasStock = hasStock(b);
      if (query.sort === "createdAt:desc") {
        const aHasG = productTitleHasG(a);
        const bHasG = productTitleHasG(b);
        if (aHasG && !bHasG) return -1;
        if (!aHasG && bHasG) return 1;
        if (aHasStock && !bHasStock) return -1;
        if (!aHasStock && bHasStock) return 1;
        return getProductCreatedAt(b) - getProductCreatedAt(a);
      }
      if (query.hasDiscount) {
        const aHasG = productTitleHasG(a);
        const bHasG = productTitleHasG(b);
        if (aHasG && !bHasG) return -1;
        if (!aHasG && bHasG) return 1;
      }
      if (aHasStock && !bHasStock) return -1;
      if (!aHasStock && bHasStock) return 1;
      return 0;
    });

    if (query.sort === "price:asc" || query.sort === "price:desc") {
      filteredProducts.sort((a, b) => {
        const aHasStock = hasStock(a);
        const bHasStock = hasStock(b);
        if (aHasStock && !bHasStock) return -1;
        if (!aHasStock && bHasStock) return 1;
        const priceA = getMinVariationPrice(a);
        const priceB = getMinVariationPrice(b);
        return query.sort === "price:asc" ? priceA - priceB : priceB - priceA;
      });
    }

    if (rawProducts.length > 0 && filteredProducts.length === 0) {
      logger.warn("[PLP] All products filtered out", {
        rawCount: rawProducts.length,
        categorySlugs: categorySlugs?.slice(0, 3),
      });
    }

    const meta = data.meta?.pagination;
    const total = typeof meta?.total === "number" ? meta.total : filteredProducts.length;
    const pageCount =
      typeof meta?.pageCount === "number" ? meta.pageCount : Math.ceil(total / pageSize);

    return {
      products: filteredProducts,
      pagination: {
        page: query.page,
        pageSize,
        pageCount,
        total,
      },
    };
  } catch (error) {
    logger.error("[PLP] Error parsing or filtering products", { error: String(error) });
    return { products: [], pagination: { page: query.page, pageSize, pageCount: 0, total: 0 } };
  }
}

export function buildPLPPageCopy(query: PLPQuery, category?: PLPCategoryContext) {
  const pageName = category
    ? `خرید ${category.title}`
    : query.search
      ? `نتایج جستجو برای "${query.search}"`
      : "فروشگاه";
  const pageDescription = category
    ? `خرید ${category.title} با بهترین قیمت و ارسال سریع از ${SITE_NAME}`
    : query.search
      ? `نتایج جستجو برای «${query.search}» در ${SITE_NAME}`
      : `مشاهده و خرید انواع محصولات با بهترین قیمت در ${SITE_NAME}`;
  const pathname = category ? getCategoryPlpHref(category.slug) : "/plp";
  const url = query.search
    ? `${SITE_URL}${pathname}?search=${encodeURIComponent(query.search)}`
    : `${SITE_URL}${pathname}`;

  return { pageName, pageDescription, url };
}

export function buildCollectionItems(products: PLPProduct[]) {
  return products.slice(0, 20).map((product) => {
    const variations = product.attributes.product_variations?.data || [];
    const prices = variations
      .map((v: Variation) => {
        const price = parseFloat(String(v.attributes.Price || "0"));
        const discountPrice = parseFloat(String(v.attributes.DiscountPrice || "0"));
        return discountPrice > 0 ? discountPrice : price;
      })
      .filter((price: number) => price > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : undefined;
    const imageUrl = product.attributes.CoverImage?.data?.attributes?.url
      ? `${IMAGE_BASE_URL}${product.attributes.CoverImage.data.attributes.url}`
      : undefined;
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
}

export function buildPLPMetadata(query: PLPQuery, category?: PLPCategoryContext): Metadata {
  const baseTitle = `فروشگاه | ${SITE_NAME}`;

  if (query.search) {
    const q = query.search.slice(0, 60);
    const pathname = category ? getCategoryPlpHref(category.slug) : "/plp";
    const title = category
      ? `جستجو در ${category.title}: "${q}" | ${SITE_NAME}`
      : `نتایج جستجو برای "${q}" | ${SITE_NAME}`;
    const description = category
      ? `مشاهده نتایج جستجو برای «${q}» در دسته ${category.title}.`
      : `مشاهده نتایج جستجو برای «${q}» در ${SITE_NAME}. جدیدترین و محبوب‌ترین محصولات.`;
    const canonicalUrl = `${SITE_URL}${pathname}?search=${encodeURIComponent(q)}`;

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
    const title = `خرید ${category.title} | ${SITE_NAME}`;
    const description = `خرید ${category.title} با بهترین قیمت و ارسال سریع از ${SITE_NAME}. جدیدترین محصولات ${category.title}.`;
    const canonicalUrl = `${SITE_URL}${getCategoryPlpHref(category.slug)}`;
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

export function buildInvalidPLPMetadata(): Metadata {
  return {
    title: `فروشگاه | ${SITE_NAME}`,
    description: `مشاهده و خرید انواع محصولات با بهترین قیمت در ${SITE_NAME}.`,
    robots: {
      index: false,
      follow: false,
    },
    alternates: { canonical: `${SITE_URL}/plp` },
  };
}
