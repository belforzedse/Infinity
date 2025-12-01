import { ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/services";
import type { ImageResponse } from "../cart";

/**
 * Product search response interface matching the API specification
 */
export interface ProductSearchResponse {
  data: ProductSearchItem[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

/**
 * Product search item interface
 * Matches Strapi entityService response format
 */
export interface ProductSearchItem {
  id: number;
  attributes?: {
    Slug?: string;
    Title: string;
    Description: string;
    product_main_category?: {
      data: {
        id: number;
        attributes: {
          Title: string;
        };
      } | null;
    };
    product_variations?: {
      data: Array<{
        id: number;
        attributes: {
          SKU?: string;
          Price: number | string;
          DiscountPrice?: number | string;
          product_variation_color?: {
            data: {
              id: number;
              attributes: {
                Title: string;
              };
            } | null;
          };
          product_variation_size?: {
            data: {
              id: number;
              attributes: {
                Title: string;
              };
            } | null;
          };
          product_variation_model?: {
            data: {
              id: number;
              attributes: {
                Title: string;
              };
            } | null;
          };
          product_stock?: {
            data: {
              id: number;
              attributes: {
                Count: number;
              };
            } | null;
          };
        };
      }>;
    };
    CoverImage?: {
      data: ImageResponse | null;
    };
  };
  // Flattened format (for backwards compatibility)
  Slug?: string;
  Title?: string;
  Description?: string;
  Price?: number;
  product_main_category?: {
    id: number;
    Title: string;
  } | {
    data: {
      id: number;
      attributes: {
        Title: string;
      };
    } | null;
  };
  product_tags?: {
    id: number;
    Title: string;
  }[];
  product_variations?: {
    id: number;
    SKU?: string;
    Price: number;
    DiscountPrice?: number;
    product_variation_color: {
      id: number;
      Title: string;
    };
    product_variation_size: {
      id: number;
      Title: string;
    };
    product_variation_model: {
      id: number;
      Title: string;
    };
    product_stock: {
      id: number;
      Count: number;
    };
  }[] | {
    data: Array<{
      id: number;
      attributes: {
        SKU?: string;
        Price: number | string;
        DiscountPrice?: number | string;
      };
    }>;
  };
  CoverImage?: ImageResponse | {
    data: ImageResponse | null;
  };
}

/**
 * Search products by query string
 *
 * @param q - Search query string
 * @param page - Page number (default: 1)
 * @param pageSize - Items per page (default: 10)
 * @returns ProductSearchResponse containing search results and pagination metadata
 */
export const searchProducts = async (
  q: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<ProductSearchResponse> => {
  if (!q) {
    throw new Error("Search query (q) is required");
  }

  try {
    const endpoint = `${ENDPOINTS.PRODUCT.SEARCH}?q=${encodeURIComponent(
      q,
    )}&page=${page}&pageSize=${pageSize}`;
    const response = await apiClient.getPublic<ProductSearchResponse>(endpoint);
    return response as unknown as ProductSearchResponse;
  } catch (error) {
    console.error("Error searching products:", JSON.stringify(error), error?.toString());
    throw error;
  }
};
