import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
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
      params: {
        "pagination[limit]": -1, // Fetch all categories without pagination limit
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to get categories:", error);
    throw error;
  }
};
