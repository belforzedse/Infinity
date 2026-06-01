export const revalidate = 30; // refresh PDP data every 30 seconds

import Breadcrumb from "@/components/Kits/Breadcrumb";
import Hero from "@/components/PDP/Hero";
import OffersListHomePage from "@/components/PDP/OffersListHomePage";
import FavoriteIcon from "@/components/PDP/Icons/FavoriteIcon";
import PDPComment from "@/components/PDP/Comment";
import PageContainer from "@/components/layout/PageContainer";
import { normalizeUserInfo, type ProductReview } from "@/services/product/product-review.service";
import Link from "next/link";
import type { Metadata } from "next";
import { IMAGE_BASE_URL, ENDPOINTS, getStrapiServerUrl } from "@/constants/api";
import { SITE_NAME } from "@/config/site";
import logger from "@/utils/logger";
import { translateErrorMessage } from "@/lib/errorTranslations";
import { ProductSchema } from "@/components/SEO/ProductSchema";
import { BreadcrumbSchema } from "@/components/SEO/BreadcrumbSchema";
import { ReviewSchema } from "@/components/SEO/ReviewSchema";
import ViewItemTracker from "@/components/Analytics/ViewItemTracker";
import type { ProductDetail } from "@/services/product/product";
import {
  getRelatedProductsByMainCategory,
  getRelatedProductsByOtherCategories,
} from "@/services/product/product";
import { getCategoryPlpHref } from "@/utils/plpRoutes";

type ProductLookupResult = {
  product: ProductDetail | null;
  errorDetails?: { message?: string; status?: number; endpoint?: string };
};

const decodeProductSlug = (slug: string) => {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
};

const stripHtml = (value: unknown) =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? value.slice(0, maxLength).trim() : value;

const normalizeRelation = (rel: any, isVariation = false): any => {
  if (!rel) return null;

  if (rel.data) return rel;

  if (Array.isArray(rel)) {
    return {
      data: rel.map((item: any) => {
        if (item.attributes) {
          if (isVariation) {
            const {
              product_stock,
              product_variation_color,
              product_variation_size,
              product_variation_model,
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
          ...rest
        } = item;
        const normalized: any = { id, attributes: rest };

        if (isVariation) {
          normalized.attributes.product_stock = normalizeRelation(product_stock);
          normalized.attributes.product_variation_color =
            normalizeRelation(product_variation_color);
          normalized.attributes.product_variation_size = normalizeRelation(product_variation_size);
          normalized.attributes.product_variation_model =
            normalizeRelation(product_variation_model);
        }

        return normalized;
      }),
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

const normalizeProductDetail = (rawProduct: any): ProductDetail | null => {
  if (!rawProduct) return null;

  if (rawProduct.attributes) {
    return {
      ...rawProduct,
      attributes: {
        ...rawProduct.attributes,
        product_main_category: normalizeRelation(rawProduct.attributes.product_main_category),
        product_other_categories: normalizeRelation(rawProduct.attributes.product_other_categories),
        product_variations: normalizeRelation(rawProduct.attributes.product_variations, true),
        product_reviews: normalizeRelation(rawProduct.attributes.product_reviews),
        product_tags: normalizeRelation(rawProduct.attributes.product_tags),
        CoverImage: normalizeRelation(rawProduct.attributes.CoverImage),
        Media: normalizeRelation(rawProduct.attributes.Media),
        Files: normalizeRelation(rawProduct.attributes.Files),
        product_size_helper: normalizeRelation(rawProduct.attributes.product_size_helper),
      },
    };
  }

  const {
    id,
    product_main_category,
    product_other_categories,
    product_variations,
    product_reviews,
    product_tags,
    CoverImage,
    Media,
    Files,
    product_size_helper,
    ...rest
  } = rawProduct;

  return {
    id,
    attributes: {
      ...rest,
      product_main_category: normalizeRelation(product_main_category),
      product_other_categories: normalizeRelation(product_other_categories),
      product_variations: normalizeRelation(product_variations, true),
      product_reviews: normalizeRelation(product_reviews),
      product_tags: normalizeRelation(product_tags),
      CoverImage: normalizeRelation(CoverImage),
      Media: normalizeRelation(Media),
      Files: normalizeRelation(Files),
      product_size_helper: normalizeRelation(product_size_helper),
    },
  } as ProductDetail;
};

const isActiveProduct = (product: ProductDetail | null) =>
  product?.attributes?.Status === "Active" && !product?.attributes?.removedAt;

const fetchPdpProduct = async (
  decodedSlug: string,
  revalidateSeconds: number,
): Promise<ProductLookupResult> => {
  const strapiBaseUrl = getStrapiServerUrl();
  const encodedSlug = encodeURIComponent(decodedSlug);
  const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}/by-slug/${encodedSlug}`;
  const apiUrl = `${strapiBaseUrl}${endpoint}`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    next: { revalidate: revalidateSeconds },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      product: null,
      errorDetails: {
        message: errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        endpoint: apiUrl,
      },
    };
  }

  const data = await response.json();
  return { product: normalizeProductDetail(data?.data), errorDetails: { endpoint: apiUrl } };
};

/**
 * Generate static params for popular products to pre-render at build time
 * Pre-generates top 200 products (newest, highest rated)
 * Remaining products will use ISR with 30s revalidation
 * Uses actual product slugs for SEO-friendly URLs
 */
export async function generateStaticParams() {
  try {
    const strapiBaseUrl = getStrapiServerUrl();
    // Fetch top products by different criteria to get a diverse set
    // Include Slug field for SEO-friendly URLs
    const endpoints = [
      // Newest products
      `${ENDPOINTS.PRODUCT.PRODUCT}?filters[Status][$eq]=Active&filters[removedAt][$null]=true&sort[0]=createdAt:desc&pagination[limit]=100&fields[0]=id&fields[1]=Slug`,
      // Highest rated products
      `${ENDPOINTS.PRODUCT.PRODUCT}?filters[Status][$eq]=Active&filters[removedAt][$null]=true&sort[0]=AverageRating:desc&pagination[limit]=100&fields[0]=id&fields[1]=Slug`,
    ];

    const responses = await Promise.all(
      endpoints.map((endpoint) =>
        fetch(`${strapiBaseUrl}${endpoint}`, {
          next: { revalidate: 3600 }, // Cache for 1 hour
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }).then((res) => res.json()),
      ),
    );

    const allProducts: Array<{ id: number; slug: string }> = [];
    const seenIds = new Set<number>();

    // Combine and deduplicate products
    responses.forEach((response) => {
      const products = response?.data || [];
      products.forEach((product: { id: number; attributes?: { Slug?: string } }) => {
        if (product.id && !seenIds.has(product.id)) {
          seenIds.add(product.id);
          // Use Slug if available, otherwise fall back to ID
          const slug = product.attributes?.Slug || product.id.toString();
          allProducts.push({ id: product.id, slug });
        }
      });
    });

    // Generate params using actual slugs for SEO-friendly URLs
    const params = allProducts
      .slice(0, 200) // Limit to top 200 for build performance
      .map((product) => ({
        slug: product.slug,
      }));

    logger.info(
      `[generateStaticParams] Generated ${params.length} static params for product pages`,
    );
    return params;
  } catch (error) {
    logger.error("[generateStaticParams] Error generating static params:", {
      error: String(error),
    });
    // Return empty array on error - ISR will handle remaining products
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://new.infinitycolor.co";

  let product: ProductDetail | null = null;
  const decodedSlug = decodeProductSlug(slug);
  const isNumericId = /^\d+$/.test(decodedSlug);
  const requestedUrl = `${SITE_URL}/pdp/${slug}`;

  try {
    const lookup = await fetchPdpProduct(decodedSlug, 3600);
    if (lookup.product && isActiveProduct(lookup.product)) {
      product = lookup.product;
    } else if (lookup.errorDetails?.status) {
      logger.warn("[PDP Metadata] Failed to fetch product for metadata", {
        slug,
        status: lookup.errorDetails.status,
      });
    }

    if (!product) {
      return {
        title: "محصول یافت نشد",
        description: `محصول مورد نظر در ${SITE_NAME} یافت نشد.`,
        robots: {
          index: false,
          follow: false,
        },
        alternates: { canonical: requestedUrl },
      };
    }

    const titleRaw = product.attributes?.Title?.trim() || "";
    const title = titleRaw || `محصول ${product.id || decodedSlug}`;
    const descRaw = stripHtml(product.attributes?.Description);
    const description = descRaw
      ? truncate(descRaw, 160)
      : `خرید ${titleRaw || "محصول"} از ${SITE_NAME}`;
    const imageUrl = product.attributes?.CoverImage?.data?.attributes?.url
      ? `${IMAGE_BASE_URL}${product.attributes.CoverImage.data.attributes.url}`
      : undefined;

    // Get price info for OpenGraph
    const variations = product?.attributes?.product_variations?.data || [];
    const prices = variations
      .map((v: any) => {
        const price = parseFloat(v?.attributes?.Price || "0");
        const discountPrice = parseFloat(v?.attributes?.DiscountPrice || "0");
        return discountPrice > 0 ? discountPrice : price;
      })
      .filter((p) => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const hasStock = variations.length > 0;

    // Build OpenGraph object with product-specific properties
    // Note: Next.js Metadata API only supports: "website", "article", "book", "profile"
    // Product-specific properties are added as custom metadata
    const openGraphBase: any = {
      title,
      description,
      type: "website",
      url: requestedUrl,
      siteName: SITE_NAME,
      locale: "fa_IR",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: titleRaw,
            },
          ]
        : undefined,
    };

    // Add product-specific OpenGraph properties if data exists
    if (minPrice > 0) {
      openGraphBase["product:price:amount"] = minPrice.toString();
      openGraphBase["product:price:currency"] = "IRR";
    }
    if (hasStock) {
      openGraphBase["product:availability"] = "in stock";
    }

    return {
      title,
      description,
      keywords: [titleRaw, "خرید", "فروشگاه آنلاین", "اینفینیتی"],
      openGraph: openGraphBase,
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: imageUrl ? [imageUrl] : undefined,
      },
      alternates: {
        canonical: requestedUrl,
      },
      robots: isNumericId
        ? {
            index: false,
            follow: false,
          }
        : undefined,
    };
  } catch (error) {
    logger.error("[PDP Metadata] Error fetching product for metadata", {
      slug,
      error: String(error),
    });
    return {
      title: "محصول یافت نشد",
      description: `محصول مورد نظر در ${SITE_NAME} یافت نشد.`,
      robots: {
        index: false,
        follow: false,
      },
      alternates: { canonical: requestedUrl },
    };
  }
}

export default async function PDP({ params }: { params: Promise<{ slug: string }> }) {
  // Handle both Promise<{slug}> and direct {slug} parameter formats
  const { slug } = await params;

  // Log for debugging (server-side logs appear in terminal)
  logger.info("[PDP] Fetching product", { slug, timestamp: new Date().toISOString() });
  const strapiBaseUrl = getStrapiServerUrl();

  // Verify the server-side Strapi URL is available (critical for server components)
  if (!strapiBaseUrl || strapiBaseUrl === "undefined") {
    const errorMsg = `Strapi server URL is not configured. Current value: ${strapiBaseUrl}`;
    logger.error("[PDP] Configuration error", {
      errorMsg,
      internalEnvVar: process.env.STRAPI_INTERNAL_URL,
      publicEnvVar: process.env.NEXT_PUBLIC_API_BASE_URL,
    });
    throw new Error(errorMsg);
  }

  // Decode slug first (Next.js may pass it already encoded), then encode for URL
  // This prevents double-encoding issues
  const decodedSlug = decodeProductSlug(slug);

  // Fetch product data from API using server-safe fetch
  let productData: ProductDetail | null = null;
  let errorDetails: { message?: string; status?: number; endpoint?: string } = {};

  try {
    logger.info("[PDP] Making API request", {
      originalSlug: slug,
      decodedSlug,
      apiBaseUrl: strapiBaseUrl,
      hasApiBaseUrl: !!strapiBaseUrl,
    });

    const lookup = await fetchPdpProduct(decodedSlug, 30);
    errorDetails = {
      ...errorDetails,
      ...lookup.errorDetails,
    };

    logger.info("[PDP] API response received", {
      status: lookup.errorDetails?.status || 200,
      ok: Boolean(lookup.product),
    });

    if (!lookup.product) {
      if (lookup.errorDetails) {
        errorDetails = lookup.errorDetails;
      }
      logger.error("[PDP] API request failed", errorDetails);
      throw new Error(errorDetails.message || "Product not found");
    }

    productData = lookup.product;

    // Check if product is trashed (removedAt is not null)
    const status = productData?.attributes?.Status;
    const removedAt = productData?.attributes?.removedAt;
    if (productData && (status !== "Active" || removedAt)) {
      errorDetails = {
        message: "Product has been removed or is inactive",
        status: 404,
        endpoint: lookup.errorDetails?.endpoint,
      };
      logger.warn("[PDP] Product is inactive or removed", {
        slug,
        productId: productData?.id,
        status,
        removedAt,
      });
      throw new Error("Product not found");
    }

    logger.info("[PDP] Product found successfully", {
      productId: productData?.id,
      title: productData?.attributes?.Title?.substring(0, 50),
      hasAttributes: !!productData?.attributes,
    });
  } catch (err: any) {
    errorDetails = {
      message: err?.message || String(err),
      status: err?.status || (err as any)?.response?.status,
      endpoint:
        errorDetails.endpoint ||
        `${strapiBaseUrl}${ENDPOINTS.PRODUCT.PRODUCT}/by-slug/${encodeURIComponent(slug)}`,
    };
    logger.error("[PDP] Error fetching product", {
      slug,
      error: errorDetails.message,
      status: errorDetails.status,
      stack: err?.stack,
    });

    // Try ID fallback if slug looks like a number
    // Use server-safe fetch instead of getProductById (which uses apiClient with localStorage)
    const isNumericSlug = /^\d+$/.test(decodedSlug);
    if (isNumericSlug && !productData) {
      logger.info("[PDP] Attempting ID-based fallback", { decodedSlug });
      try {
        // Server-safe fetch with same populate parameters as getProductById
        const fallbackEndpoint = `${ENDPOINTS.PRODUCT.PRODUCT}/${decodedSlug}?populate[0]=CoverImage&populate[1]=Media&populate[2]=product_main_category&populate[3]=product_reviews&populate[4]=product_tags&populate[5]=product_variations&populate[6]=product_variations.product_stock&populate[7]=product_variations.product_variation_color&populate[8]=product_variations.product_variation_size&populate[9]=product_variations.product_variation_model&populate[10]=product_other_categories&populate[11]=product_size_helper&populate[12]=product_reviews.user&populate[13]=product_reviews.user.user_info&populate[14]=product_reviews.product_review_replies&populate[15]=product_reviews.product_review_replies.user&populate[16]=product_reviews.product_review_replies.user.user_info`;
        const fallbackUrl = `${strapiBaseUrl}${fallbackEndpoint}`;

        const fallbackResponse = await fetch(fallbackUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          next: { revalidate: 30 },
        });

        if (!fallbackResponse.ok) {
          throw new Error(`HTTP ${fallbackResponse.status}: ${fallbackResponse.statusText}`);
        }

        const fallbackData = await fallbackResponse.json();

        if (fallbackData?.data) {
          productData = normalizeProductDetail(fallbackData.data);

          // Check if product is trashed
          const status = productData?.attributes?.Status;
          const removedAt = productData?.attributes?.removedAt;
          if (productData && (status !== "Active" || removedAt)) {
            throw new Error("Product has been removed or is inactive");
          }

          logger.info("[PDP] Product found via ID fallback", { productId: productData?.id });
        }
      } catch (idError: any) {
        logger.error("[PDP] ID fallback also failed", {
          decodedSlug,
          error: idError?.message || String(idError),
          status: idError?.status,
          stack: idError?.stack,
        });
      }
    }
  }

  // If we still don't have product data, show error message with details in dev mode
  if (!productData || !productData.attributes) {
    const isDev = process.env.NODE_ENV === "development";

    return (
      <div className="flex flex-col items-center justify-center gap-8 p-10">
        <h1 className="text-2xl font-bold">محصول مورد نظر یافت نشد</h1>
        <p>لطفا محصول دیگری را انتخاب کنید یا به صفحه اصلی بازگردید.</p>
        {isDev && errorDetails.message && (
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-left text-sm text-red-800">
            <p className="font-semibold">Debug Info (Development Mode):</p>
            <p>Original Slug: {slug}</p>
            <p>Decoded Slug: {decodedSlug}</p>
            <p>
              Error:{" "}
              {translateErrorMessage(
                errorDetails.message,
                "متأسفانه مشکلی پیش آمد. دوباره تلاش کنید.",
              )}
            </p>
            {errorDetails.status && <p>Status: {errorDetails.status}</p>}
            {errorDetails.endpoint && <p>Endpoint: {errorDetails.endpoint}</p>}
            {strapiBaseUrl && <p>API Base URL: {strapiBaseUrl}</p>}
          </div>
        )}
        <Link href="/" className="text-blue-500">
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  // Get category name from either Title or Name field (no fallback placeholder)
  const categoryName =
    productData.attributes.product_main_category?.data?.attributes?.Title ||
    productData.attributes.product_main_category?.data?.attributes?.Name ||
    "";

  const categorySlug = productData.attributes.product_main_category?.data?.attributes?.Slug || "";

  const productTitle = productData.attributes.Title || "";

  // Fetch related products
  const productId = productData.id?.toString() || "";
  const mainCategoryId = productData.attributes.product_main_category?.data?.id?.toString() || "";

  // Get IDs of other categories this product belongs to
  const otherCategoryIds =
    productData.attributes.product_other_categories?.data
      ?.map((cat) => cat.id?.toString())
      .filter(Boolean) || [];

  // Fetch related products from same main category and other categories
  let sameMainCategoryProducts: any[] = [];
  let otherCategoriesProducts: any[] = [];

  try {
    // Use Promise.all but handle potential errors for each promise separately
    const results = await Promise.allSettled([
      getRelatedProductsByMainCategory(mainCategoryId, productId),
      getRelatedProductsByOtherCategories(otherCategoryIds, productId),
    ]);

    if (results[0].status === "fulfilled") {
      sameMainCategoryProducts = results[0].value;
    } else {
      logger.error("Error fetching main category products", {
        error: String(results[0].reason),
      });
    }

    if (results[1].status === "fulfilled") {
      otherCategoriesProducts = results[1].value;
    } else {
      logger.error("Error fetching other categories products", {
        error: String(results[1].reason),
      });
    }
  } catch (error) {
    logger.error("Error fetching related products", { error: String(error) });
  }

  // Format product reviews data for the component
  const productReviews: ProductReview[] =
    productData.attributes.product_reviews?.data
      ?.filter((review: any) => {
        const attrs = review.attributes || {};
        return attrs.Status === "Accepted" && !attrs.removedAt;
      })
      .map((review: any) => {
        const attrs = review.attributes || {};
        const rawUserInfo = attrs.user?.data?.attributes?.user_info;
        const normalizedUserInfo = normalizeUserInfo(rawUserInfo);

        // Basic normalization to match ProductReview interface
        return {
          id: review.id,
          Content: attrs.Content || "",
          Status: attrs.Status || "Accepted",
          Date: attrs.Date || attrs.createdAt,
          Rate: attrs.Rate || 0,
          LikeCounts: attrs.LikeCounts || 0,
          DislikeCounts: attrs.DislikeCounts || 0,
          user: attrs.user?.data
            ? {
                id: attrs.user.data.id,
                ...attrs.user.data.attributes,
                user_info: normalizedUserInfo,
              }
            : attrs.user,
          product_review_replies:
            attrs.product_review_replies?.data?.map((reply: any) => ({
              id: reply.id,
              ...reply.attributes,
              user: reply.attributes?.user?.data
                ? {
                    id: reply.attributes.user.data.id,
                    ...reply.attributes.user.data.attributes,
                  }
                : reply.attributes?.user,
            })) || [],
          createdAt: attrs.createdAt,
          updatedAt: attrs.updatedAt,
        };
      }) || [];

  const breadcrumbItems = [
    {
      label: "صفحه اصلی",
      href: "/",
    },
    {
      label: categoryName,
      href: getCategoryPlpHref(categorySlug),
    },
    {
      label: productTitle,
    },
  ];

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://new.infinitycolor.co";
  const productUrl = `${SITE_URL}/pdp/${slug}`;
  const averageRating = productData.attributes.AverageRating || 0;
  const reviewCount = productData.attributes.RatingCount || productReviews.length;
  const variationPrices =
    productData.attributes.product_variations?.data
      ?.map((variation: any) => {
        const price = Number(
          variation?.attributes?.DiscountPrice || variation?.attributes?.Price || 0,
        );
        return Number.isFinite(price) ? price : 0;
      })
      .filter((price) => price > 0) || [];
  const minVisiblePrice = variationPrices.length > 0 ? Math.min(...variationPrices) : 0;

  return (
    <PageContainer variant="wide" className="flex flex-col gap-10 pb-16 pt-6">
      {/* JSON-LD Schemas for SEO */}
      <ViewItemTracker
        productId={productData.id || 0}
        title={productTitle}
        price={minVisiblePrice}
      />
      {productData && <ProductSchema product={productData} slug={slug} />}
      {productReviews.length > 0 && (
        <ReviewSchema
          productName={productTitle}
          productUrl={productUrl}
          averageRating={averageRating}
          reviewCount={reviewCount}
          reviews={productReviews}
        />
      )}
      <BreadcrumbSchema breadcrumbs={breadcrumbItems} />

      <div className="flex flex-col gap-3">
        <Breadcrumb breadcrumbs={breadcrumbItems} />

        <Hero productData={productData} productId={productId} />
      </div>

      {/* Other Products in the same main category */}
      {sameMainCategoryProducts.length > 0 && (
        <OffersListHomePage
          icon={<FavoriteIcon />}
          title="شاید بپسندید"
          products={sameMainCategoryProducts}
        />
      )}

      {/* Other Products in other categories */}
      {otherCategoriesProducts.length > 0 && (
        <OffersListHomePage
          icon={<FavoriteIcon />}
          title="محصولات مشابه"
          products={otherCategoriesProducts}
        />
      )}

      <PDPComment
        productId={productId}
        productReviews={productReviews}
        rating={productData.attributes.AverageRating || 0}
        rateCount={productData.attributes.RatingCount || 0}
        productData={productData}
      />

      {/* <PDPHeroInfoFAQItem
        title="عنوان توضیحات سئو در این قسمت قرار می گیرد"
        content={productData.attributes.Description || ""}
      /> */}
    </PageContainer>
  );
}
