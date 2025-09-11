import { apiClient } from "..";
// removed unused import: ApiResponse from "@/types/api"

export interface ImageResponse {
  id: number;
  url: string;
  width?: number;
  height?: number;
  formats?: {
    thumbnail?: { url: string; width: number; height: number };
    small?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
  };
}

export interface ProductLike {
  id: number;
  product: {
    id: number;
    title: string;
    description: string;
    price: number;
    images: ImageResponse[];
    product_main_category: {
      id: number;
      title?: string;
      Title?: string;
    };
    product_tags: any[];
    discount?: number;
    CoverImage?: ImageResponse;
    product_variations: Array<{
      id: number;
      Price: number;
      SKU: string;
      product_variation_color?: {
        id: number;
        Title: string;
      };
      product_variation_size?: {
        id: number;
        Title: string;
      };
      product_variation_model?: {
        id: number;
        Title: string;
      };
      product_stock?: {
        id: number;
        Count: number;
      };
    }>;
  };
}

export interface ProductLikeResponse {
  data: ProductLike[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

const ProductLikeService = {
  /**
   * Get the authenticated user's favorite products
   * @param page Page number for pagination
   * @param pageSize Number of items per page
   * @returns Promise with product likes data
   */
  getUserFavorites: async (page = 1, pageSize = 25) => {
    try {
      const response = await apiClient.get(
        `/product-likes/user/me?page=${page}&pageSize=${pageSize}`,
      );
      return response;
    } catch (error: any) {
      console.error("Error fetching user favorites:", error);
      throw error;
    }
  },

  /**
   * Toggle product like status (add/remove from favorites)
   * @param productId The ID of the product to toggle like status
   * @returns Promise with response data
   */
  toggleProductLike: async (productId: number) => {
    try {
      const response = await apiClient.post(`/product-likes/toggle`, {
        productId,
      });
      return response;
    } catch (error: any) {
      console.error("Error toggling product like:", error);
      throw error;
    }
  },
};

export default ProductLikeService;
