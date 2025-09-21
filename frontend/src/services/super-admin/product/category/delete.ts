import { apiClient } from "@/services";
import { ENDPOINTS, STRAPI_TOKEN } from "@/constants/api";
import { PaginatedResponse } from "@/types/api";

export interface CategoryAttributes {
  Title: string;
  Slug: string;
  Parent?: string;
  createdAt: string;
  updatedAt: string;
}

interface Item {
  id: number;
  attributes: CategoryAttributes;
}

export const deleteCategory = async (id: string): Promise<PaginatedResponse<Item>> => {
  try {
    const endpoint = `${ENDPOINTS.PRODUCT.CATEGORY}/${id}`;
    //const accessToken = localStorage.getItem("accessToken");

    const response = await apiClient.delete<PaginatedResponse<Item>>(endpoint, {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};
