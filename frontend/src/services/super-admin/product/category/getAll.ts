import { apiClient } from "@/services";
import { ENDPOINTS, STRAPI_TOKEN } from "@/constants/api";
import type { PaginatedResponse } from "@/types/api";

export interface CategoryAttributes {
  Title: string;
  Slug?: string;
  Parent?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface categoryResponseType {
  id: number;
  attributes: CategoryAttributes;
}

export const getAllCategories = async (): Promise<PaginatedResponse<categoryResponseType>> => {
  const endpoint = `${ENDPOINTS.PRODUCT.CATEGORY}`;
  //const accessToken = localStorage.getItem("accessToken");
  try {
    const response = await apiClient.get<PaginatedResponse<categoryResponseType>>(endpoint, {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
    });
    return response as any;
  } catch (error) {
    console.error("Failed to get categories:", error);
    throw error;
  }
};
