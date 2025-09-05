import { apiClient } from "@/services";
import { ENDPOINTS, IMAGE_BASE_URL } from "@/constants/api"; // removed unused: STRAPI_TOKEN
import { ApiResponse } from "@/types/api";
import { ProductCardProps } from "@/components/Product/Card";

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
    Description: string;
    Status: "Active" | "InActive";
    AverageRating?: number;
    RatingCount?: number;
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

// Get product by ID instead of slug since current API doesn't have slug field
export const getProductById = async (
  id: string,
): Promise<ApiResponse<ProductDetail>> => {
  const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}/${id}?populate[0]=CoverImage&populate[1]=Media&populate[2]=product_main_category&populate[3]=product_reviews&populate[4]=product_tags&populate[5]=product_variations&populate[6]=product_variations.product_stock&populate[7]=product_variations.product_variation_color&populate[8]=product_variations.product_variation_size&populate[9]=product_variations.product_variation_model&populate[10]=product_other_categories&populate[11]=product_size_helper&populate[12]=product_reviews.user&populate[13]=product_reviews.user.user_info&populate[14]=product_reviews.product_review_replies`;

  try {
    const response = await apiClient.get<any>(endpoint);

    return response;
  } catch (error) {
    console.error("Error fetching product details:", error);
    throw error;
  }
};

// Keeping the original method for compatibility
export const getProductBySlug = async (
  slug: string,
): Promise<ApiResponse<ProductDetail>> => {
  // Since slug is not available, let's try to get a product by ID
  // If slug can be converted to a number, we'll use it as an ID
  const productId = isNaN(parseInt(slug)) ? "1" : slug;

  try {
    return await getProductById(productId);
  } catch (error) {
    console.error("Error fetching product details by slug:", error);
    throw error;
  }
};

// Create a placeholder image for non-image media types
const getPlaceholderImage = (
  mediaType: string,
): { url: string; width: number; height: number } => {
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
      // Get thumbnail URL or use a placeholder
      let thumbnailUrl = "";
      if (coverImage.attributes.formats?.thumbnail?.url) {
        thumbnailUrl = `${IMAGE_BASE_URL}${coverImage.attributes.formats.thumbnail.url}`;
      } else {
        // Create a placeholder image based on type
        const placeholder = getPlaceholderImage(coverImage.attributes.mime);
        thumbnailUrl = placeholder.url;
      }

      assets.push({
        id: coverImage.id.toString(),
        type: isVideo ? ("video" as const) : ("image" as const),
        src: `${IMAGE_BASE_URL}${coverImage.attributes.url}`,
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
        // Get thumbnail URL or use a placeholder
        let thumbnailUrl = "";
        if (media.attributes.formats?.thumbnail?.url) {
          thumbnailUrl = `${IMAGE_BASE_URL}${media.attributes.formats.thumbnail.url}`;
        } else {
          // Create a placeholder image based on type
          const placeholder = getPlaceholderImage(media.attributes.mime);
          thumbnailUrl = placeholder.url;
        }

        assets.push({
          id: media.id.toString(),
          type: isVideo ? ("video" as const) : ("image" as const),
          src: `${IMAGE_BASE_URL}${media.attributes.url}`,
          thumbnail: thumbnailUrl,
          alt: media.attributes.alternativeText || product.attributes.Title,
        });
      }
    });
  }

  // If no valid assets were found, add a default placeholder
  if (assets.length === 0) {
    assets.push({
      id: "default",
      type: "image" as const,
      src: "/images/pdp/image-1.png",
      thumbnail: "/images/pdp/image-1-th.png",
      alt: product.attributes.Title || "Product Image",
    });
  }

  return assets;
};

// Find the first available product variation to use as default
export const getDefaultProductVariation = (product: ProductDetail) => {
  if (!product.attributes.product_variations?.data?.length) {
    return null;
  }

  // First try to find a published variation with stock
  const publishedWithStock = product.attributes.product_variations.data.find(
    (variation) => {
      // Check if the variation is published
      if (!variation.attributes.IsPublished) {
        return false;
      }

      // Check if it has stock data and quantity > 0
      const stock = variation.attributes.product_stock?.data?.attributes;
      return stock && typeof stock.Count === "number" && stock.Count > 0;
    },
  );

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
    if (
      variation.attributes.IsPublished &&
      variation.attributes.product_variation_color?.data
    ) {
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
    if (
      variation.attributes.IsPublished &&
      variation.attributes.product_variation_color?.data
    ) {
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
    if (
      variation.attributes.IsPublished &&
      variation.attributes.product_variation_size?.data
    ) {
      // If colorId is specified, only include sizes for that color
      if (
        colorId &&
        variation.attributes.product_variation_color?.data.id !== colorId
      ) {
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
export const getProductSizesWithStock = (
  product: ProductDetail,
  colorId?: number,
) => {
  if (!product.attributes.product_variations?.data?.length) {
    return [];
  }

  const sizes = new Map();

  product.attributes.product_variations.data.forEach((variation) => {
    if (
      variation.attributes.IsPublished &&
      variation.attributes.product_variation_size?.data
    ) {
      // If colorId is specified, only include sizes for that color
      if (
        colorId &&
        variation.attributes.product_variation_color?.data.id !== colorId
      ) {
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
    if (
      variation.attributes.IsPublished &&
      variation.attributes.product_variation_model?.data
    ) {
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
    console.log("=== STOCK CHECK DEBUG ===");
    console.log("Variation ID:", variation?.id);
    console.log("Full variation object:", variation);
    console.log("Product stock data:", variation?.attributes?.product_stock);
    console.log(
      "Stock attributes:",
      variation?.attributes?.product_stock?.data?.attributes,
    );
  }

  if (!variation?.attributes?.product_stock?.data?.attributes) {
    if (process.env.NODE_ENV !== "production") {
      console.log("No stock data found - returning false");
    }
    return false;
  }

  const stockData = variation.attributes.product_stock.data.attributes;
  if (process.env.NODE_ENV !== "production") {
    console.log("Stock data object:", stockData);
    console.log("Available keys in stock data:", Object.keys(stockData));
  }

  const stockQuantity = stockData.Count;
  if (process.env.NODE_ENV !== "production") {
    console.log("Stock Count value:", stockQuantity);
    console.log("Requested quantity:", requestedQuantity);
  }

  // Updated validation: Check if stock is sufficient for the requested quantity
  const hasStock =
    typeof stockQuantity === "number" && stockQuantity >= requestedQuantity;
  if (process.env.NODE_ENV !== "production") {
    console.log("Has sufficient stock:", hasStock);
    console.log("=== END STOCK CHECK ===");
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
      !colorId ||
      variation.attributes.product_variation_color?.data?.id === colorId;
    const sizeMatch =
      !sizeId ||
      variation.attributes.product_variation_size?.data?.id === sizeId;
    const modelMatch =
      !modelId ||
      variation.attributes.product_variation_model?.data?.id === modelId;

    return (
      variation.attributes.IsPublished && colorMatch && sizeMatch && modelMatch
    );
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

  const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}?filters[product_main_category][id][$eq]=${categoryId}&filters[id][$ne]=${productId}&filters[Status][$eq]=Active&populate[0]=CoverImage&populate[1]=product_main_category&populate[2]=product_variations&populate[3]=product_variations.general_discounts&pagination[limit]=${limit}`;

  try {
    const response = await apiClient.get<any>(endpoint);
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
  if (
    !otherCategoryIds ||
    !Array.isArray(otherCategoryIds) ||
    otherCategoryIds.length === 0
  ) {
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
    // Build filter for other categories
    const categoryFilters = validCategoryIds
      .map(
        (id, index) =>
          `filters[product_other_categories][id][$in][${index}]=${id}`,
      )
      .join("&");

    const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}?${categoryFilters}&filters[id][$ne]=${productId}&filters[Status][$eq]=Active&populate[0]=CoverImage&populate[1]=product_main_category&populate[2]=product_variations&populate[3]=product_variations.general_discounts&pagination[limit]=${limit}`;

    const response = await apiClient.get<any>(endpoint);
    return formatProductsToCardProps((response as any).data);
  } catch (error) {
    console.error(
      "Error fetching related products by other categories:",
      error,
    );
    return [];
  }
};

// Helper function to convert API product data to ProductCardProps format
const formatProductsToCardProps = (products: any[]): ProductCardProps[] => {
  // Check if products is undefined or empty
  if (!products || !Array.isArray(products) || products.length === 0) {
    return [];
  }

  return products
    .map((product) => {
      // Skip products with missing attributes
      if (!product || !product.attributes || !product.id) {
        return null;
      }

      // Get first variation with price
      const variation = product.attributes.product_variations?.data?.find(
        (v: any) => v.attributes.Price && parseInt(v.attributes.Price) > 0,
      );

      if (!variation) return null;

      const hasDiscount =
        variation.attributes.general_discounts?.data?.length > 0;
      const discount = hasDiscount
        ? variation.attributes.general_discounts.data[0].attributes.Amount
        : undefined;
      const price = parseInt(variation.attributes.Price);

      return {
        id: product.id.toString(),
        images: [
          `${IMAGE_BASE_URL}${product.attributes.CoverImage?.data?.attributes?.url}`,
        ],
        category:
          product.attributes.product_main_category?.data?.attributes?.Title ||
          "",
        title: product.attributes.Title,
        price,
        ...(hasDiscount && {
          discount,
          discountPrice: price * (1 - discount! / 100),
        }),
        seenCount: product.attributes.RatingCount || 0,
      };
    })
    .filter((product): product is ProductCardProps => product !== null);
};
