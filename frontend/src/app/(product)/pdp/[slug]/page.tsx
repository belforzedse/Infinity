export const revalidate = 30; // refresh PDP data every 30 seconds

import Breadcrumb from "@/components/Kits/Breadcrumb";
import Hero from "@/components/PDP/Hero";
import OffersListHomePage from "@/components/PDP/OffersListHomePage";
import FavoriteIcon from "@/components/PDP/Icons/FavoriteIcon";
import PDPComment from "@/components/PDP/Comment";
import PageContainer from "@/components/layout/PageContainer";
import type { ProductReview } from "@/components/PDP/Comment/List";
import Link from "next/link";
import type { Metadata } from "next";
import { IMAGE_BASE_URL, API_BASE_URL, ENDPOINTS } from "@/constants/api";
import logger from "@/utils/logger";
import { ProductSchema } from "@/components/SEO/ProductSchema";
import { BreadcrumbSchema } from "@/components/SEO/BreadcrumbSchema";
import { ReviewSchema } from "@/components/SEO/ReviewSchema";
import type {
  ProductDetail} from "@/services/product/product";
import {
  getProductById,
  getRelatedProductsByMainCategory,
  getRelatedProductsByOtherCategories,
} from "@/services/product/product";

/**
 * Generate static params for popular products to pre-render at build time
 * Pre-generates top 200 products (newest, highest rated)
 * Remaining products will use ISR with 30s revalidation
 * Uses actual product slugs for SEO-friendly URLs
 */
export async function generateStaticParams() {
  try {
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
        fetch(`${API_BASE_URL}${endpoint}`, {
          next: { revalidate: 3600 }, // Cache for 1 hour
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }).then((res) => res.json())
      )
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

    logger.info(`[generateStaticParams] Generated ${params.length} static params for product pages`);
    return params;
  } catch (error) {
    logger.error('[generateStaticParams] Error generating static params:', { error: String(error) });
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
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://infinitycolor.org";

  let product: ProductDetail | undefined = undefined;

  try {
    // Decode slug first to prevent double-encoding
    let decodedSlug = slug;
    try {
      decodedSlug = decodeURIComponent(slug);
    } catch {
      decodedSlug = slug;
    }

    // Use server-safe fetch for metadata generation too
    const encodedSlug = encodeURIComponent(decodedSlug);
    const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}/by-slug/${encodedSlug}`;
    const apiUrl = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      next: { revalidate: 3600 }, // Cache metadata for 1 hour
    });

    if (response.ok) {
      const data = await response.json();
      product = data?.data as ProductDetail | undefined;
    } else {
      logger.warn("[PDP Metadata] Failed to fetch product for metadata", { 
        slug, 
        status: response.status 
      });
    }

    const titleRaw = product?.attributes?.Title || "محصول";
    const descRaw = product?.attributes?.Description || titleRaw;
    const description = String(descRaw).slice(0, 160);
    const imageUrl = product?.attributes?.CoverImage?.data?.attributes?.url
      ? `${IMAGE_BASE_URL}${product.attributes.CoverImage.data.attributes.url}`
      : undefined;

    const title = `خرید ${titleRaw} | اینفینیتی استور`;
    const productId = product?.id || slug;

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
    const openGraphBase: any = {
      title,
      description,
      type: "product",
      url: `${SITE_URL}/pdp/${slug}`,
      siteName: "اینفینیتی استور",
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
        canonical: `${SITE_URL}/pdp/${slug}`,
      },
    };
  } catch (error) {
    logger.error("[PDP Metadata] Error fetching product for metadata", { 
      slug, 
      error: String(error) 
    });
    const fallbackTitle = "مشاهده محصول | اینفینیتی استور";
    return {
      title: fallbackTitle,
      description: "جزئیات و مشخصات کامل محصول در اینفینیتی استور",
      alternates: { canonical: `${SITE_URL}/pdp/${slug}` },
    };
  }
}

export default async function PDP({ params }: { params: Promise<{ slug: string }> }) {
  // Handle both Promise<{slug}> and direct {slug} parameter formats
  const { slug } = await params;

  // Log for debugging (server-side logs appear in terminal)
  logger.info("[PDP] Fetching product", { slug, timestamp: new Date().toISOString() });

  // Verify API_BASE_URL is available (critical for server components)
  if (!API_BASE_URL || API_BASE_URL === "undefined") {
    const errorMsg = `API_BASE_URL is not configured. Current value: ${API_BASE_URL}`;
    logger.error("[PDP] Configuration error", { errorMsg, envVar: process.env.NEXT_PUBLIC_API_BASE_URL });
    throw new Error(errorMsg);
  }

  // Decode slug first (Next.js may pass it already encoded), then encode for URL
  // This prevents double-encoding issues
  let decodedSlug = slug;
  try {
    // Try to decode - if it's already decoded, this will just return the original
    decodedSlug = decodeURIComponent(slug);
  } catch {
    // If decoding fails, slug is already decoded, use as-is
    decodedSlug = slug;
  }

  // Fetch product data from API using server-safe fetch
  let productData: ProductDetail | null = null;
  let error: any = null;
  let errorDetails: { message?: string; status?: number; endpoint?: string } = {};

  try {
    // Use server-safe fetch instead of apiClient (apiClient uses localStorage which doesn't exist on server)
    // Encode the decoded slug for the URL
    const encodedSlug = encodeURIComponent(decodedSlug);
    const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}/by-slug/${encodedSlug}`;
    const apiUrl = `${API_BASE_URL}${endpoint}`;

    logger.info("[PDP] Making API request", { 
      originalSlug: slug,
      decodedSlug,
      encodedSlug, 
      endpoint, 
      apiUrl,
      apiBaseUrl: API_BASE_URL,
      hasApiBaseUrl: !!API_BASE_URL,
    });

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      next: { revalidate: 30 }, // ISR: revalidate every 30 seconds
    });

    logger.info("[PDP] API response received", { 
      status: response.status, 
      statusText: response.statusText,
      ok: response.ok 
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      errorDetails = {
        message: errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        endpoint: apiUrl,
      };
      logger.error("[PDP] API request failed", errorDetails);
      throw new Error(errorDetails.message);
    }

    const data = await response.json();
    
    if (data?.data) {
      // Normalize data structure: backend may return flat structure or Strapi REST format
      const rawProduct = data.data;
      
      // Helper function to normalize a relation (single or array)
      // Also handles nested relations within variations
      const normalizeRelation = (rel: any, isVariation = false): any => {
        if (!rel) return null;
        
        // If already in Strapi format (has data wrapper), return as-is
        if (rel.data) return rel;
        
        // If it's an array of flat objects
        if (Array.isArray(rel)) {
          return {
            data: rel.map((item: any) => {
              if (item.attributes) {
                // Already normalized, but check nested relations if it's a variation
                if (isVariation) {
                  const { product_stock, product_variation_color, product_variation_size, product_variation_model, ...rest } = item.attributes;
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
              // Flat structure - normalize it
              const { id, product_stock, product_variation_color, product_variation_size, product_variation_model, ...rest } = item;
              const normalized: any = { id, attributes: rest };
              
              // Normalize nested relations if this is a variation
              if (isVariation) {
                normalized.attributes.product_stock = normalizeRelation(product_stock);
                normalized.attributes.product_variation_color = normalizeRelation(product_variation_color);
                normalized.attributes.product_variation_size = normalizeRelation(product_variation_size);
                normalized.attributes.product_variation_model = normalizeRelation(product_variation_model);
              }
              
              return normalized;
            }),
          };
        }
        
        // Single flat object - wrap in Strapi format
        if (rel.id !== undefined) {
          const { id, ...rest } = rel;
          return {
            data: { id, attributes: rest },
          };
        }
        
        return null;
      };
      
      if (rawProduct.attributes) {
        // Already in Strapi REST format - but normalize relations
        productData = {
          ...rawProduct,
          attributes: {
            ...rawProduct.attributes,
            product_main_category: normalizeRelation(rawProduct.attributes.product_main_category),
            product_other_categories: normalizeRelation(rawProduct.attributes.product_other_categories),
            product_variations: normalizeRelation(rawProduct.attributes.product_variations, true), // true = isVariation
            product_reviews: normalizeRelation(rawProduct.attributes.product_reviews),
            product_tags: normalizeRelation(rawProduct.attributes.product_tags),
            CoverImage: normalizeRelation(rawProduct.attributes.CoverImage),
            Media: normalizeRelation(rawProduct.attributes.Media),
            Files: normalizeRelation(rawProduct.attributes.Files),
            product_size_helper: normalizeRelation(rawProduct.attributes.product_size_helper),
          },
        };
      } else {
        // Flat structure - normalize to Strapi format
        const { id, product_main_category, product_other_categories, product_variations, product_reviews, product_tags, CoverImage, Media, Files, product_size_helper, ...rest } = rawProduct;
        productData = {
          id,
          attributes: {
            ...rest,
            product_main_category: normalizeRelation(product_main_category),
            product_other_categories: normalizeRelation(product_other_categories),
            product_variations: normalizeRelation(product_variations, true), // true = isVariation
            product_reviews: normalizeRelation(product_reviews),
            product_tags: normalizeRelation(product_tags),
            CoverImage: normalizeRelation(CoverImage),
            Media: normalizeRelation(Media),
            Files: normalizeRelation(Files),
            product_size_helper: normalizeRelation(product_size_helper),
          },
        };
        logger.info("[PDP] Normalized flat product structure to Strapi format", { productId: id });
      }
      
      // Check if product is trashed (removedAt is not null)
      if (productData && productData.attributes?.removedAt) {
        errorDetails = {
          message: "Product has been removed",
          status: 404,
          endpoint: apiUrl,
        };
        logger.warn("[PDP] Product is trashed", { slug, productId: productData?.id });
        throw new Error("Product not found");
      }
      
      logger.info("[PDP] Product found successfully", { 
        productId: productData?.id, 
        title: productData?.attributes?.Title?.substring(0, 50),
        hasAttributes: !!productData?.attributes
      });
    } else {
      logger.warn("[PDP] API returned no data", { slug, responseData: data });
    }
  } catch (err: any) {
    error = err;
    errorDetails = {
      message: err?.message || String(err),
      status: err?.status || (err as any)?.response?.status,
      endpoint: errorDetails.endpoint || `${API_BASE_URL}${ENDPOINTS.PRODUCT.PRODUCT}/by-slug/${encodeURIComponent(slug)}`,
    };
    logger.error("[PDP] Error fetching product", { 
      slug, 
      error: errorDetails.message,
      status: errorDetails.status,
      stack: err?.stack,
    });

    // Try ID fallback if slug looks like a number
    const isNumericSlug = /^\d+$/.test(decodedSlug);
    if (isNumericSlug && !productData) {
      logger.info("[PDP] Attempting ID-based fallback", { decodedSlug });
      try {
        const response = await getProductById(decodedSlug);
        if (response.data) {
          productData = response.data;
          logger.info("[PDP] Product found via ID fallback", { productId: productData?.id });
        }
      } catch (idError) {
        logger.error("[PDP] ID fallback also failed", { decodedSlug, error: String(idError) });
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
            <p>Error: {errorDetails.message}</p>
            {errorDetails.status && <p>Status: {errorDetails.status}</p>}
            {errorDetails.endpoint && <p>Endpoint: {errorDetails.endpoint}</p>}
            {API_BASE_URL && <p>API Base URL: {API_BASE_URL}</p>}
          </div>
        )}
        <Link href="/" className="text-blue-500">
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  // Get category name from either Title or Name field (with proper null checks)
  const categoryName =
    productData.attributes.product_main_category?.data?.attributes?.Title ||
    productData.attributes.product_main_category?.data?.attributes?.Name ||
    "دسته بندی";

  const categorySlug =
    productData.attributes.product_main_category?.data?.attributes?.Slug || "دسته-بندی";

  const productTitle = productData.attributes.Title || "محصول";

  // Fetch related products
  const productId = productData.id?.toString() || "";
  const mainCategoryId = productData.attributes.product_main_category?.data?.id?.toString() || "";

  // Get IDs of other categories this product belongs to
  const otherCategoryIds =
    productData.attributes.product_other_categories?.data?.map((cat) => cat.id?.toString()).filter(Boolean) || [];

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
    productData.attributes.product_reviews?.data?.map((review) => {
      // Use a type assertion to treat the API response as having the correct fields
      const reviewAttributes = review.attributes as unknown as {
        Rate: number;
        Content: string;
        createdAt: string;
        LikeCounts: number;
        DislikeCounts: number;
        user: typeof review.attributes.user;
        product_review_replies: typeof review.attributes.product_review_replies;
      };

      return {
        id: review.id,
        attributes: {
          Rate: reviewAttributes.Rate,
          Content: reviewAttributes.Content,
          createdAt: reviewAttributes.createdAt,
          user: reviewAttributes.user,
          LikeCounts: reviewAttributes.LikeCounts || 0,
          DislikeCounts: reviewAttributes.DislikeCounts || 0,
          product_review_replies: reviewAttributes.product_review_replies,
        },
      };
    }) || [];

  const breadcrumbItems = [
    {
      label: "صفحه اصلی",
      href: "/",
    },
    {
      label: categoryName,
      href: `/plp?category=${categorySlug}`,
    },
    {
      label: productTitle,
    },
  ];

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://infinitycolor.org";
  const productUrl = `${SITE_URL}/pdp/${slug}`;
  const averageRating = productData.attributes.AverageRating || 0;
  const reviewCount = productData.attributes.RatingCount || productReviews.length;

  return (
    <PageContainer variant="wide" className="flex flex-col gap-10 pb-16 pt-6">
      {/* JSON-LD Schemas for SEO */}
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
        rating={productData.attributes.AverageRating || 0}
        rateCount={productData.attributes.RatingCount || 0}
        productReviews={productReviews}
        productId={productId}
      />

      {/* <PDPHeroInfoFAQItem
        title="عنوان توضیحات سئو در این قسمت قرار می گیرد"
        content={
          productData.attributes.Description ||
          "مانتو زنانه شیک و مجلسی با پارچه نخی درجه یک، مناسب برای استفاده روزمره و مهمانی"
        }
      /> */}
    </PageContainer>
  );
}
