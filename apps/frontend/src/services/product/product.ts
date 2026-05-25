import { apiClient } from "@/services";
import { API_BASE_URL, ENDPOINTS, getStrapiServerUrl } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import type { ProductCardProps } from "@/components/Product/Card";
import logger from "@/utils/logger";
import { computeDiscountForVariation, parseNumber } from "@/utils/discounts";
import { resolveAssetUrl } from "@/utils/resolveAssetUrl";

export interface ProductMedia {
  id: number;
  attributes: {
    name: string;
    alternativeText: string | null;
    caption: string | null;
    width: number | null;
    height: number | null;
    formats: {
      thumbnail?: {
        url: string;
        width: number;
        height: number;
      };
      small?: {
        url: string;
        width: number;
        height: number;
      };
      medium?: {
        url: string;
        width: number;
        height: number;
      };
      large?: {
        url: string;
        width: number;
        height: number;
      };
    } | null;
    mime: string;
    url: string;
    ext: string;
    previewUrl?: string; // Optional preview URL for videos
  };
}

export interface ProductSizeHelper {
  id: number;
  attributes: {
    Helper: Array<{
      size: string;
      [key: string]: string; // For dynamic measurement keys like 'دور کمر', 'دور باسن', etc.
    }>;
    createdAt: string;
    updatedAt: string;
  };
}

export interface ProductDetail {
  id: number;
  attributes: {
    Title: string;
    Slug?: string;
    Description: string;
    Status: "Active" | "InActive";
    AverageRating?: number;
    RatingCount?: number;
    SeenCount?: number;
    CleaningTips?: string;
    ReturnConditions?: string;
    createdAt: string;
    updatedAt: string;
    removedAt?: string;
    CoverImage: {
      data: ProductMedia;
    };
    Media: {
      data: ProductMedia[];
    };
    product_variations: {
      data: Array<{
        id: number;
        attributes: {
          IsPublished?: boolean;
          SKU: string;
          Price: string | number;
          DiscountPrice?: string | number;
          product_stock?: {
            data: {
              id: number;
              attributes: {
                Count: number;
              };
            };
          };
          product_variation_color?: {
            data: {
              id: number;
              attributes: {
                Title: string;
                ColorCode: string;
              };
            };
          };
          product_variation_size?: {
            data: {
              id: number;
              attributes: {
                Title: string;
              };
            };
          };
          product_variation_model?: {
            data: {
              id: number;
              attributes: {
                Title: string;
              };
            };
          };
        };
      }>;
    };
    product_main_category: {
      data: {
        id: number;
        attributes: {
          Title?: string;
          Name?: string;
          Slug?: string;
        };
      } | null;
    };
    product_other_categories?: {
      data: Array<{
        id: number;
        attributes: {
          Title?: string;
          Name?: string;
          Slug?: string;
        };
      }>;
    };
    product_reviews?: {
      data: Array<{
        id: number;
        attributes: {
          Rating: number;
          Comment: string;
          createdAt: string;
          LikeCount?: number;
          DislikeCount?: number;
          user?: {
            data: {
              id: number;
              attributes: {
                Phone: string;
                user_info?: {
                  data: {
                    attributes: {
                      FirstName: string;
                      LastName: string;
                    };
                  };
                };
              };
            };
          };
          product_review_replies?: {
            data: Array<{
              id: number;
              attributes: {
                Content: string;
                createdAt: string;
              };
            }>;
          };
        };
      }>;
    };
    product_tags?: {
      data: Array<{
        id: number;
        attributes: {
          Title: string;
        };
      }>;
    };
    product_size_helper?: {
      data: ProductSizeHelper | null;
    };
  };
}

interface VariationColorAttributes {
  ColorCode?: string;
}

interface VariationColorRelation {
  id?: number;
  attributes?: VariationColorAttributes;
  ColorCode?: string;
}

interface VariationColorWrapper {
  data?: VariationColorRelation | null;
}

type VariationColorInput = VariationColorWrapper | VariationColorRelation | null | undefined;

export interface VariationInput {
  id?: number;
  attributes?: {
    IsPublished?: boolean;
    product_variation_color?: VariationColorInput;
  };
  IsPublished?: boolean;
  product_variation_color?: VariationColorInput;
}

type VariationAttributesInput = NonNullable<VariationInput["attributes"]> & {
  IsPublished?: boolean;
  product_variation_color?: VariationColorInput;
};

export interface ProductCardProjection {
  id: number;
  attributes?: {
    Title?: string;
    Slug?: string;
    SeenCount?: number | null;
    Price?: number | string | null;
    DiscountPrice?: number | string | null;
    Discount?: number | string | null;
    IsAvailable?: boolean | null;
    InventoryCount?: number | string | null;
    ColorsCount?: number | string | null;
    ColorCodes?: string[] | null;
    CoverImage?: {
      url?: string | null;
      formats?: {
        thumbnail?: { url?: string | null };
        small?: { url?: string | null };
        medium?: { url?: string | null };
      } | null;
      data?: {
        attributes?: {
          url?: string | null;
          formats?: {
            thumbnail?: { url?: string | null };
            small?: { url?: string | null };
            medium?: { url?: string | null };
          } | null;
        } | null;
      } | null;
    } | null;
    product_main_category?: {
      Title?: string | null;
      Slug?: string | null;
      data?: {
        attributes?: {
          Title?: string | null;
          Slug?: string | null;
        } | null;
      } | null;
    } | null;
  };
}

/**
 * Extracts variation attributes, handling both nested Strapi format (with .attributes)
 * and flattened format (direct properties).
 */
const getVariationAttributes = (
  variation: VariationInput
): VariationInput | VariationAttributesInput => variation.attributes ?? variation;

/**
 * Resolves color data from various input formats:
 * - VariationColorWrapper: { data: { id, attributes: { ColorCode } } }
 * - VariationColorRelation: { id, attributes: { ColorCode }, ColorCode }
 */
const resolveColorData = (
  input: VariationColorInput
): VariationColorRelation | undefined => {
  if (!input || typeof input !== "object") return undefined;
  if ("data" in input) {
    return input.data ?? undefined;
  }
  return input as VariationColorRelation;
};

const readCompactProductAttrs = (product: any) => product?.attributes ?? product ?? {};

const getCompactCoverUrl = (cover: unknown): string => {
  const coverAny = cover as any;
  const url =
    coverAny?.formats?.small?.url ||
    coverAny?.formats?.thumbnail?.url ||
    coverAny?.formats?.medium?.url ||
    coverAny?.url ||
    coverAny?.data?.attributes?.formats?.small?.url ||
    coverAny?.data?.attributes?.formats?.thumbnail?.url ||
    coverAny?.data?.attributes?.url;

  return normalizeAssetUrl(url);
};

const getCompactCategoryTitle = (category: any): string => {
  return (
    category?.Title ||
    category?.data?.attributes?.Title ||
    category?.Name ||
    category?.data?.attributes?.Name ||
    ""
  );
};

const hasCompactCardProjection = (product: any): boolean => {
  const attrs = readCompactProductAttrs(product);
  return attrs && attrs.Price !== undefined && attrs.IsAvailable !== undefined;
};

export const formatProductCardProjection = (product: ProductCardProjection): ProductCardProps | null => {
  if (!product || !product.id) return null;
  const attrs = readCompactProductAttrs(product);
  const price = parseNumber(attrs.Price) ?? 0;

  if (!price || price <= 0) return null;

  const discountPrice = parseNumber(attrs.DiscountPrice) ?? 0;
  const discount = parseNumber(attrs.Discount) ?? 0;
  const colorsCount = parseNumber(attrs.ColorsCount) ?? 0;
  const inventoryCount = parseNumber(attrs.InventoryCount) ?? 0;
  const colorCodes = Array.isArray(attrs.ColorCodes)
    ? attrs.ColorCodes.filter((code: unknown): code is string => typeof code === "string" && code.trim() !== "")
    : [];

  const result: ProductCardProps = {
    id: Number(product.id),
    slug: attrs.Slug || undefined,
    images: [getCompactCoverUrl(attrs.CoverImage)].filter(Boolean),
    category: getCompactCategoryTitle(attrs.product_main_category),
    title: attrs.Title || "",
    price,
    seenCount: parseNumber(attrs.SeenCount) || 0,
    isAvailable: attrs.IsAvailable === true,
    colorsCount: colorsCount > 0 ? colorsCount : undefined,
    colorCodes: colorCodes.length > 0 ? colorCodes : undefined,
    inventoryCount: inventoryCount > 0 ? inventoryCount : undefined,
  };

  if (discountPrice > 0 && discountPrice < price) {
    result.discountPrice = discountPrice;
    result.discount = discount > 0 ? discount : Math.round(((price - discountPrice) / price) * 100);
  } else if (discount > 0) {
    result.discount = discount;
  }

  return result;
};

const DEFAULT_LAZY_SECONDARY_MEDIA_LIMIT = 3;

const CARD_FETCH_OPTIONS = {
  next: { revalidate: 30 } as const,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Encoding": "gzip",
  },
};

const getProductCardFetchBaseUrl = () =>
  typeof window === "undefined" ? getStrapiServerUrl() : API_BASE_URL;

type LazyMediaAsset = {
  attributes?: {
    url?: string | null;
    mime?: string | null;
  } | null;
} | null;

type LazyMediaProductEntity = {
  attributes?: {
    CoverImage?: {
      data?: {
        attributes?: {
          url?: string | null;
        } | null;
      } | null;
    } | null;
    Media?: {
      data?: LazyMediaAsset[] | null;
    } | null;
  } | null;
} | null;

const lazySecondaryMediaResolved = new Map<number, string[]>();
const lazySecondaryMediaPending = new Map<number, Promise<string[]>>();

const normalizeAssetUrl = (path?: string | null): string => {
  if (!path || typeof path !== "string") return "";
  const trimmed = path.trim();
  if (!trimmed) return "";
  return resolveAssetUrl(trimmed);
};

export const extractLazySecondaryMediaUrls = (
  product: LazyMediaProductEntity,
): string[] => {
  if (!product?.attributes) return [];

  const coverUrl = normalizeAssetUrl(
    product.attributes.CoverImage?.data?.attributes?.url,
  );
  const mediaItems = product.attributes.Media?.data;
  if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
    return [];
  }

  const imageUrls = mediaItems
    .filter((mediaItem) => {
      const mime = mediaItem?.attributes?.mime;
      return typeof mime === "string" && mime.startsWith("image/");
    })
    .map((mediaItem) => normalizeAssetUrl(mediaItem?.attributes?.url))
    .filter((url): url is string => Boolean(url));

  const deduped = Array.from(new Set(imageUrls));
  return coverUrl ? deduped.filter((url) => url !== coverUrl) : deduped;
};

export const getLazySecondaryMediaByProductId = async (
  productId: number,
  limit: number = DEFAULT_LAZY_SECONDARY_MEDIA_LIMIT,
): Promise<string[]> => {
  if (!Number.isInteger(productId) || productId <= 0) {
    return [];
  }

  const safeLimit =
    Number.isFinite(limit) && limit > 0
      ? Math.floor(limit)
      : DEFAULT_LAZY_SECONDARY_MEDIA_LIMIT;

  const resolved = lazySecondaryMediaResolved.get(productId);
  if (resolved) {
    return resolved.slice(0, safeLimit);
  }

  const pending = lazySecondaryMediaPending.get(productId);
  if (pending) {
    const urls = await pending;
    return urls.slice(0, safeLimit);
  }

  const endpoint =
    `${ENDPOINTS.PRODUCT.PRODUCT}?filters[id][$eq]=${productId}&` +
    `filters[Status][$eq]=Active&` +
    `filters[removedAt][$null]=true&` +
    `fields[0]=Slug&` +
    `populate[CoverImage][fields][0]=url&` +
    `populate[Media][fields][0]=url&` +
    `populate[Media][fields][1]=mime&` +
    `_skip_global_loader=1&` +
    `pagination[limit]=1&` +
    `pagination[withCount]=false`;

  const requestPromise = (async (): Promise<string[]> => {
    try {
      const response = await apiClient.getPublic<any>(endpoint, {
        headers: {
          "x-skip-global-loader": "1",
        },
        suppressAuthRedirect: true,
        timeout: 8000,
      });

      const product = Array.isArray(response?.data) ? response.data[0] : null;
      const urls = extractLazySecondaryMediaUrls(product);
      lazySecondaryMediaResolved.set(productId, urls);
      return urls;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        logger.warn("[LazyMedia] Failed to fetch secondary media", {
          productId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      lazySecondaryMediaResolved.set(productId, []);
      return [];
    } finally {
      lazySecondaryMediaPending.delete(productId);
    }
  })();

  lazySecondaryMediaPending.set(productId, requestPromise);
  const urls = await requestPromise;
  return urls.slice(0, safeLimit);
};
// Get product by ID instead of slug since current API doesn't have slug field
export const getProductById = async (id: string): Promise<ApiResponse<ProductDetail>> => {
  const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}/${id}?populate[0]=CoverImage&populate[1]=Media&populate[2]=product_main_category&populate[3]=product_reviews&populate[4]=product_tags&populate[5]=product_variations&populate[6]=product_variations.product_stock&populate[7]=product_variations.product_variation_color&populate[8]=product_variations.product_variation_size&populate[9]=product_variations.product_variation_model&populate[10]=product_other_categories&populate[11]=product_size_helper&populate[12]=product_reviews.user&populate[13]=product_reviews.user.user_info&populate[14]=product_reviews.product_review_replies&populate[15]=product_reviews.product_review_replies.user&populate[16]=product_reviews.product_review_replies.user.user_info`;

  try {
    const response = await apiClient.get<any>(endpoint);

    // Check if product is trashed (removedAt is not null)
    const status = response.data?.attributes?.Status;
    const removedAt = response.data?.attributes?.removedAt;
    if (status !== "Active" || removedAt) {
      const error = new Error("Product not found");
      (error as any).status = 404;
      throw error;
    }

    return response;
  } catch (error) {
    console.error("Error fetching product details:", error);
    throw error;
  }
};

/**
 * Get product by slug (SEO-friendly URL)
 * Uses the new backend endpoint that supports Persian slugs
 * Falls back to ID-based lookup for backwards compatibility
 */
export const getProductBySlug = async (slug: string): Promise<ApiResponse<ProductDetail>> => {
  // Encode the slug for URL (supports Persian characters)
  const encodedSlug = encodeURIComponent(slug);
  const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}/by-slug/${encodedSlug}`;

  try {
    const response = await apiClient.get<any>(endpoint);

    // Check if product is trashed (removedAt is not null)
    const status = response.data?.attributes?.Status;
    const removedAt = response.data?.attributes?.removedAt;
    if (status !== "Active" || removedAt) {
      const error = new Error("Product not found");
      (error as Error & { status?: number }).status = 404;
      throw error;
    }

    return response;
  } catch (error) {
    // If slug-based lookup fails and slug looks like an ID, try ID-based lookup
    const isNumericSlug = /^\d+$/.test(slug);
    if (isNumericSlug) {
      console.warn(`Slug lookup failed, falling back to ID-based lookup for: ${slug}`);
      try {
        return await getProductById(slug);
      } catch (idError) {
        console.error("Error fetching product by ID fallback:", idError);
        throw idError;
      }
    }

    console.error("Error fetching product details by slug:", error);
    throw error;
  }
};

// Create a placeholder image for non-image media types
const getPlaceholderImage = (mediaType: string): { url: string; width: number; height: number } => {
  // Generate placeholders based on file type
  if (mediaType.startsWith("video")) {
    return {
      url: "/images/placeholders/video-placeholder.svg",
      width: 300,
      height: 200,
    };
  } else if (mediaType.includes("pdf")) {
    return {
      url: "/images/placeholders/pdf-placeholder.svg",
      width: 300,
      height: 400,
    };
  } else if (mediaType.startsWith("image")) {
    return {
      url: "/images/placeholders/image-placeholder.svg",
      width: 300,
      height: 200,
    };
  } else {
    return {
      url: "/images/placeholders/file-placeholder.svg",
      width: 300,
      height: 300,
    };
  }
};

export const formatGalleryAssets = (product: ProductDetail) => {
  const assets: {
    id: string;
    type: "video" | "image";
    src: string;
    thumbnail: string;
    alt: string;
  }[] = [];

  // Add cover image first if it exists
  if (product.attributes.CoverImage?.data) {
    const coverImage = product.attributes.CoverImage.data;
    const isVideo = coverImage.attributes.mime?.startsWith("video");
    const isImage = coverImage.attributes.mime?.startsWith("image");

    // Only add valid image or video types
    if (isVideo || isImage) {
      // Get thumbnail URL - for videos, try previewUrl or generate from video
      let thumbnailUrl = "";
      if (isVideo) {
        // For videos, try previewUrl first (Strapi may generate this)
        if (coverImage.attributes.previewUrl) {
          thumbnailUrl = resolveAssetUrl(coverImage.attributes.previewUrl);
        } else if (coverImage.attributes.formats?.thumbnail?.url) {
          thumbnailUrl = resolveAssetUrl(coverImage.attributes.formats.thumbnail.url);
        } else {
          // Use the video URL itself - browser will show first frame as poster
          thumbnailUrl = resolveAssetUrl(coverImage.attributes.url);
        }
      } else {
        // For images, use thumbnail format
        if (coverImage.attributes.formats?.thumbnail?.url) {
          thumbnailUrl = resolveAssetUrl(coverImage.attributes.formats.thumbnail.url);
        } else {
          // Fallback to full image URL
          thumbnailUrl = resolveAssetUrl(coverImage.attributes.url);
        }
      }

      assets.push({
        id: coverImage.id.toString(),
        type: isVideo ? ("video" as const) : ("image" as const),
        src: resolveAssetUrl(coverImage.attributes.url),
        thumbnail: thumbnailUrl,
        alt: coverImage.attributes.alternativeText || product.attributes.Title,
      });
    }
  }

  // Add media gallery if it exists
  if (product.attributes.Media?.data?.length > 0) {
    product.attributes.Media.data.forEach((media) => {
      const isVideo = media.attributes.mime?.startsWith("video");
      const isImage = media.attributes.mime?.startsWith("image");

      // Only add valid image or video types
      if (isImage || isVideo) {
        // Get thumbnail URL - for videos, try previewUrl or generate from video
        let thumbnailUrl = "";
        if (isVideo) {
          // For videos, try previewUrl first (Strapi may generate this)
          if (media.attributes.previewUrl) {
            thumbnailUrl = resolveAssetUrl(media.attributes.previewUrl);
          } else if (media.attributes.formats?.thumbnail?.url) {
            thumbnailUrl = resolveAssetUrl(media.attributes.formats.thumbnail.url);
          } else {
            // Use the video URL itself - browser will show first frame as poster
            thumbnailUrl = resolveAssetUrl(media.attributes.url);
          }
        } else {
          // For images, use thumbnail format
          if (media.attributes.formats?.thumbnail?.url) {
            thumbnailUrl = resolveAssetUrl(media.attributes.formats.thumbnail.url);
          } else {
            // Fallback to full image URL
            thumbnailUrl = resolveAssetUrl(media.attributes.url);
          }
        }

        assets.push({
          id: media.id.toString(),
          type: isVideo ? ("video" as const) : ("image" as const),
        src: resolveAssetUrl(media.attributes.url),
          thumbnail: thumbnailUrl,
          alt: media.attributes.alternativeText || product.attributes.Title,
        });
      }
    });
  }

  // Return assets array - if empty, return empty array (no placeholder)
  return assets;
};

// Find the first available product variation to use as default
export const getDefaultProductVariation = (product: ProductDetail) => {
  if (!product.attributes.product_variations?.data?.length) {
    return null;
  }

  // First try to find a published variation with stock
  const publishedWithStock = product.attributes.product_variations.data.find((variation) => {
    // Check if the variation is published
    if (!variation.attributes.IsPublished) {
      return false;
    }

    // Check if it has stock data and quantity > 0
    const stock = variation.attributes.product_stock?.data?.attributes;
    return stock && typeof stock.Count === "number" && stock.Count > 0;
  });

  if (publishedWithStock) {
    return publishedWithStock;
  }

  // If no variation with stock is found, fallback to any published variation
  const anyPublished = product.attributes.product_variations.data.find(
    (variation) => variation.attributes.IsPublished === true,
  );

  if (anyPublished) {
    return anyPublished;
  }

  // Last resort: return the first variation regardless of published status
  return product.attributes.product_variations.data[0];
};

// Helper function to get unique colors from product variations
export const getProductColors = (product: ProductDetail) => {
  if (!product.attributes.product_variations?.data?.length) {
    return [];
  }

  const colors = new Map();

  product.attributes.product_variations.data.forEach((variation) => {
    if (variation.attributes.IsPublished && variation.attributes.product_variation_color?.data) {
      const color = variation.attributes.product_variation_color.data;
      colors.set(color.id, {
        id: color.id,
        title: color.attributes.Title,
        colorCode: color.attributes.ColorCode,
      });
    }
  });

  return Array.from(colors.values());
};

// Helper function to get colors with stock availability
export const getProductColorsWithStock = (product: ProductDetail) => {
  if (!product.attributes.product_variations?.data?.length) {
    return [];
  }

  const colors = new Map();

  product.attributes.product_variations.data.forEach((variation) => {
    if (variation.attributes.IsPublished && variation.attributes.product_variation_color?.data) {
      const color = variation.attributes.product_variation_color.data;
      const hasStock = hasStockForVariation(variation);

      // If color already exists, update stock status (OR operation - if any variation has stock)
      const existingColor = colors.get(color.id);
      colors.set(color.id, {
        id: color.id,
        title: color.attributes.Title,
        colorCode: color.attributes.ColorCode,
        hasStock: existingColor ? existingColor.hasStock || hasStock : hasStock,
      });
    }
  });

  return Array.from(colors.values());
};

// Helper function to get unique sizes from product variations
export const getProductSizes = (product: ProductDetail, colorId?: number) => {
  if (!product.attributes.product_variations?.data?.length) {
    return [];
  }

  const sizes = new Map();

  product.attributes.product_variations.data.forEach((variation) => {
    if (variation.attributes.IsPublished && variation.attributes.product_variation_size?.data) {
      // If colorId is specified, only include sizes for that color
      if (colorId && variation.attributes.product_variation_color?.data.id !== colorId) {
        return;
      }

      const size = variation.attributes.product_variation_size.data;
      sizes.set(size.id, {
        id: size.id,
        title: size.attributes.Title,
      });
    }
  });

  return Array.from(sizes.values());
};

// Helper function to get sizes with stock availability for a specific color
export const getProductSizesWithStock = (product: ProductDetail, colorId?: number) => {
  if (!product.attributes.product_variations?.data?.length) {
    return [];
  }

  const sizes = new Map();

  product.attributes.product_variations.data.forEach((variation) => {
    if (variation.attributes.IsPublished && variation.attributes.product_variation_size?.data) {
      // If colorId is specified, only include sizes for that color
      if (colorId && variation.attributes.product_variation_color?.data.id !== colorId) {
        return;
      }

      const size = variation.attributes.product_variation_size.data;
      const hasStock = hasStockForVariation(variation);

      sizes.set(size.id, {
        id: size.id,
        title: size.attributes.Title,
        hasStock,
      });
    }
  });

  return Array.from(sizes.values());
};

// Helper function to get unique models from product variations
export const getProductModels = (product: ProductDetail) => {
  if (!product.attributes.product_variations?.data?.length) {
    return [];
  }

  const models = new Map();

  product.attributes.product_variations.data.forEach((variation) => {
    if (variation.attributes.IsPublished && variation.attributes.product_variation_model?.data) {
      const model = variation.attributes.product_variation_model.data;
      models.set(model.id, {
        id: model.id,
        title: model.attributes.Title,
      });
    }
  });

  return Array.from(models.values());
};

// Helper function to get the available stock count for a variation
export const getAvailableStockCount = (
  variation: ProductDetail["attributes"]["product_variations"]["data"][0],
): number => {
  if (!variation?.attributes?.product_stock?.data?.attributes) {
    return 0;
  }

  const stockData = variation.attributes.product_stock.data.attributes;
  const stockQuantity = stockData.Count;

  return typeof stockQuantity === "number" ? stockQuantity : 0;
};

// Helper function to check if a variation has sufficient stock
export const hasStockForVariation = (
  variation: ProductDetail["attributes"]["product_variations"]["data"][0],
  requestedQuantity: number = 1,
): boolean => {
  if (process.env.NODE_ENV !== "production") {
    logger.info("=== STOCK CHECK DEBUG ===");
    logger.info("Variation ID", { id: variation?.id });
    logger.info("Full variation object", { variation });
    logger.info("Product stock data", {
      stock: variation?.attributes?.product_stock,
    });
    logger.info("Stock attributes", {
      attrs: variation?.attributes?.product_stock?.data?.attributes,
    });
  }

  if (!variation?.attributes?.product_stock?.data?.attributes) {
    if (process.env.NODE_ENV !== "production") {
      logger.info("No stock data found - returning false");
    }
    return false;
  }

  const stockData = variation.attributes.product_stock.data.attributes;
  if (process.env.NODE_ENV !== "production") {
    logger.info("Stock data object", { stockData });
    logger.info("Available keys in stock data", {
      keys: Object.keys(stockData),
    });
  }

  const stockQuantity = stockData.Count;
  if (process.env.NODE_ENV !== "production") {
    logger.info("Stock Count value", { stockQuantity });
    logger.info("Requested quantity", { requestedQuantity });
  }

  // Updated validation: Check if stock is sufficient for the requested quantity
  const hasStock = typeof stockQuantity === "number" && stockQuantity >= requestedQuantity;
  if (process.env.NODE_ENV !== "production") {
    logger.info("Has sufficient stock", { hasStock });
    logger.info("=== END STOCK CHECK ===");
  }

  return hasStock;
};

// Find a specific variation by color, size, and model (if applicable)
export const findProductVariation = (
  product: ProductDetail,
  colorId?: number,
  sizeId?: number,
  modelId?: number,
) => {
  if (!product.attributes.product_variations?.data?.length) {
    return null;
  }

  return product.attributes.product_variations.data.find((variation) => {
    const colorMatch =
      !colorId || variation.attributes.product_variation_color?.data?.id === colorId;
    const sizeMatch = !sizeId || variation.attributes.product_variation_size?.data?.id === sizeId;
    const modelMatch =
      !modelId || variation.attributes.product_variation_model?.data?.id === modelId;

    return variation.attributes.IsPublished && colorMatch && sizeMatch && modelMatch;
  });
};

// Get related products from the same main category
export const getRelatedProductsByMainCategory = async (
  categoryId: string,
  productId: string,
  limit: number = 10,
): Promise<ProductCardProps[]> => {
  // Return empty array if category ID is empty or invalid
  if (!categoryId || categoryId === "undefined" || categoryId === "null") {
    return [];
  }

  const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}?view=card&filters[product_main_category][id][$eq]=${categoryId}&filters[id][$ne]=${productId}&filters[Status][$eq]=Active&filters[removedAt][$null]=true&filters[product_variations][Price][$gte]=1&filters[product_variations][product_stock][Count][$gt]=0&pagination[limit]=${limit}`;

  try {
    const response = await fetch(`${getProductCardFetchBaseUrl()}${endpoint}`, CARD_FETCH_OPTIONS).then((res) =>
      res.json(),
    );
    return formatProductsToCardProps((response as any).data);
  } catch (error) {
    console.error("Error fetching related products by main category:", error);
    return [];
  }
};

// Get related products from other categories
export const getRelatedProductsByOtherCategories = async (
  otherCategoryIds: string[],
  productId: string,
  limit: number = 10,
): Promise<ProductCardProps[]> => {
  // Return empty array if there are no valid category IDs
  if (!otherCategoryIds || !Array.isArray(otherCategoryIds) || otherCategoryIds.length === 0) {
    return [];
  }

  // Filter out invalid category IDs
  const validCategoryIds = otherCategoryIds.filter(
    (id) => id && id !== "undefined" && id !== "null",
  );

  if (validCategoryIds.length === 0) {
    return [];
  }

  try {
    // Build filter for other categories - include Slug field
    const categoryFilters = validCategoryIds
      .map((id, index) => `filters[product_other_categories][id][$in][${index}]=${id}`)
      .join("&");

    const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}?view=card&${categoryFilters}&filters[id][$ne]=${productId}&filters[Status][$eq]=Active&filters[removedAt][$null]=true&filters[product_variations][Price][$gte]=1&filters[product_variations][product_stock][Count][$gt]=0&pagination[limit]=${limit}`;

    const response = await fetch(`${getProductCardFetchBaseUrl()}${endpoint}`, CARD_FETCH_OPTIONS).then((res) =>
      res.json(),
    );
    return formatProductsToCardProps((response as any).data);
  } catch (error) {
    console.error("Error fetching related products by other categories:", error);
    return [];
  }
};

// Helper function to convert API product data to ProductCardProps format
/**
 * Calculate the count of unique colors among published variations
 */
export const calculateUniqueColorsCount = (variations: VariationInput[]): number => {
  if (!variations || !Array.isArray(variations)) return 0;

  const uniqueColors = new Set<number>();
  variations.forEach((variation: VariationInput) => {
    // Handle both nested Strapi format (v.attributes) and flattened format (v)
    const attrs = getVariationAttributes(variation);
    const colorData = resolveColorData(attrs.product_variation_color);

    // Only count color if variation is published (defaults to true if undefined)
    if (attrs.IsPublished !== false && colorData?.id) {
      uniqueColors.add(colorData.id);
    }
  });

  return uniqueColors.size;
};

/**
 * Get unique color codes among published variations
 */
export const getUniqueColorCodes = (variations: VariationInput[]): string[] => {
  if (!variations || !Array.isArray(variations)) return [];

  const colors = new Map<number, string>();
  variations.forEach((variation: VariationInput) => {
    // Handle both nested Strapi format (v.attributes) and flattened format (v)
    const attrs = getVariationAttributes(variation);
    const colorData = resolveColorData(attrs.product_variation_color);
    const colorCode = colorData?.attributes?.ColorCode ?? colorData?.ColorCode;

    // Only collect color if variation is published and has a color code
    if (attrs.IsPublished !== false && colorData?.id && colorCode) {
      colors.set(colorData.id, colorCode);
    }
  });

  return Array.from(colors.values());
};

export const formatProductsToCardProps = (products: any[]): ProductCardProps[] => {
  // Check if products is undefined or empty
  if (!products || !Array.isArray(products) || products.length === 0) {
    return [];
  }

  return products
    .map((product) => {
      if (hasCompactCardProjection(product)) {
        return formatProductCardProjection(product);
      }

      // Skip products with missing attributes
      if (!product || !product.attributes || !product.id) {
        return null;
      }

      // Get first variation with price AND stock
      const variation = product.attributes.product_variations?.data?.find((v: any) => {
        if (v.attributes.IsPublished !== true) return false;
        const hasPrice = v.attributes.Price && parseInt(v.attributes.Price) > 0;
        const stockCount = v.attributes.product_stock?.data?.attributes?.Count;
        const hasStock = typeof stockCount === "number" && stockCount > 0;
        return hasPrice && hasStock;
      });

      if (!variation) return null;

      const price = parseNumber(variation.attributes.Price);
      if (!price || price <= 0) {
        return null;
      }

      const discountEvaluation = computeDiscountForVariation({
        Price: variation.attributes.Price,
        DiscountPrice: variation.attributes.DiscountPrice,
        general_discounts: variation.attributes.general_discounts,
      });

      // Check if any variation has stock available
      const isAvailable =
        product.attributes.product_variations?.data?.some((v: any) => {
          if (v.attributes.IsPublished !== true) return false;
          const stockCount = v.attributes.product_stock?.data?.attributes?.Count;
          return typeof stockCount === "number" && stockCount > 0;
        }) || false;

      // Calculate unique colors count and codes
      const variations = product.attributes.product_variations?.data || [];
      const colorsCount = calculateUniqueColorsCount(variations);
      const colorCodes = getUniqueColorCodes(variations);

      // Extract additional images from Media
      const additionalImages = (product.attributes.Media?.data || [])
        .filter((m: any) => m.attributes?.mime?.startsWith("image/"))
        .map((m: any) => resolveAssetUrl(m.attributes?.url))
        .filter(Boolean);

      // Get first variation's SKU as product code
      const productCode = variation.attributes.SKU || undefined;

      const result: ProductCardProps = {
        id: parseInt(product.id),
        slug: product.attributes.Slug || undefined,
        images: [
          resolveAssetUrl(product.attributes.CoverImage?.data?.attributes?.url),
          ...additionalImages,
        ].filter(Boolean),
        category: product.attributes.product_main_category?.data?.attributes?.Title || "",
        title: product.attributes.Title,
        price,
        seenCount: product.attributes.SeenCount || 0,
        isAvailable,
        colorsCount: colorsCount > 0 ? colorsCount : undefined,
        colorCodes: colorCodes.length > 0 ? colorCodes : undefined,
        productCode,
      };

      if (
        discountEvaluation &&
        discountEvaluation.discountAmount > 0 &&
        discountEvaluation.finalPrice < discountEvaluation.basePrice
      ) {
        const discountPercent =
          discountEvaluation.discountPercent !== undefined
            ? discountEvaluation.discountPercent
            : Math.round((discountEvaluation.discountAmount / discountEvaluation.basePrice) * 100);

        result.discount = discountPercent;
        result.discountPrice = Math.round(discountEvaluation.finalPrice);
      }

      return result;
    })
    .filter((product): product is ProductCardProps => product !== null);
};

/**
 * Get multiple products by their IDs
 * Returns products formatted for card display
 */
export const getProductsByIds = async (
  ids: (number | string)[],
): Promise<ProductCardProps[]> => {
  if (!ids || ids.length === 0) {
    return [];
  }

  // Filter out invalid IDs
  const validIds = ids
    .map((id) => {
      const numId = typeof id === "string" ? parseInt(id, 10) : id;
      return isNaN(numId) ? null : numId;
    })
    .filter((id): id is number => id !== null);

  if (validIds.length === 0) {
    return [];
  }

  // Build filter for multiple IDs using $in operator
  const idFilter = `filters[id][$in]=${validIds.join(",")}`;
  const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}?view=card&${idFilter}&filters[Status][$eq]=Active&filters[removedAt][$null]=true&filters[product_variations][Price][$gte]=1&pagination[limit]=${validIds.length}`;

  try {
    const response = await apiClient.get<any>(endpoint);
    return formatProductsToCardProps((response as any).data || []);
  } catch (error) {
    logger.error("Error fetching products by IDs:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

/**
 * Get multiple products by their slugs
 * Returns products formatted for card display
 */
export const getProductsBySlugs = async (slugs: string[]): Promise<ProductCardProps[]> => {
  if (!slugs || slugs.length === 0) {
    return [];
  }

  // Filter out empty slugs
  const validSlugs = slugs.filter((slug) => slug && slug.trim().length > 0);

  if (validSlugs.length === 0) {
    return [];
  }

  // Build filter for multiple slugs using $in operator
  const slugFilter = `filters[Slug][$in]=${validSlugs.map((slug) => encodeURIComponent(slug)).join(",")}`;
  const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}?view=card&${slugFilter}&filters[Status][$eq]=Active&filters[removedAt][$null]=true&filters[product_variations][Price][$gte]=1&pagination[limit]=${validSlugs.length}`;

  try {
    const response = await apiClient.get<any>(endpoint);
    return formatProductsToCardProps((response as any).data || []);
  } catch (error) {
    logger.error("Error fetching products by slugs:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};
