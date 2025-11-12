import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import type { ApiResponse } from "@/types/api";

export interface CategoryDetail {
  id: number;
  attributes: {
    Title: string;
    Slug: string;
    Parent?: string | null;
    parent?: {
      data: {
        id: number;
        attributes: {
          Title?: string;
        };
      } | null;
    };
    createdAt: string;
    updatedAt: string;
  };
}

export const getCategoryById = async (
  id: string | number,
): Promise<ApiResponse<CategoryDetail>> => {
  const endpoint = `${ENDPOINTS.PRODUCT.CATEGORY}/${id}?populate=parent`;
  const response = await apiClient.get<ApiResponse<CategoryDetail>>(endpoint);
  return response.data;
};
