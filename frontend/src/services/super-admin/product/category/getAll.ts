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
    // Use no-store cache for super-admin pages to ensure fresh data
    const response = await apiClient.get<PaginatedResponse<categoryResponseType>>(endpoint, {
      params: {
        "pagination[pageSize]": 1000, // Fetch all categories (up to 1000, should be enough)
      },
      cache: "no-store",
    });
    return response.data;
  } catch (error) {
    // Error will be thrown and handled by caller
    throw error;
  }
};
