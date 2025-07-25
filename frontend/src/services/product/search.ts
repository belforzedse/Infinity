import { ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/services";
import { ImageResponse } from "../cart";

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
 */
export interface ProductSearchItem {
  id: number;
  Title: string;
  Description: string;
  Price: number;
  product_main_category: {
    id: number;
    Title: string;
  };
  product_tags: {
    id: number;
    Title: string;
  }[];
  product_variations: {
    id: number;
    Price: number;
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
  }[];
  CoverImage: ImageResponse;
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
  pageSize: number = 10
): Promise<ProductSearchResponse> => {
  if (!q) {
    throw new Error("Search query (q) is required");
  }

  try {
    const endpoint = `${ENDPOINTS.PRODUCT.SEARCH}?q=${encodeURIComponent(
      q
    )}&page=${page}&pageSize=${pageSize}`;
    const response = await apiClient.getPublic<ProductSearchResponse>(endpoint);
    return response as unknown as ProductSearchResponse;
  } catch (error) {
    console.error(
      "Error searching products:",
      JSON.stringify(error),
      error?.toString()
    );
    throw error;
  }
};
