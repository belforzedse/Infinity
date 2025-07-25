import { apiClient } from "@/services";
import { ENDPOINTS, STRAPI_TOKEN } from "@/constants/api";
import { ApiResponse } from "@/types/api";

export interface CategoryData {
  Title: string;
  Slug: string;
  Parent?: string;
}

export const createCategory = async (
  category: CategoryData
): Promise<ApiResponse<any>> => {
  const endpoint = ENDPOINTS.PRODUCT.CATEGORY;

  try {
    const response = await apiClient.post<ApiResponse<any>>(
      endpoint,
      {
        data: category,
      },
      {
        headers: {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};
