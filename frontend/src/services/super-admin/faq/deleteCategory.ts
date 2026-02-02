import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import type { PaginatedResponse } from "@/types/api";

export interface FAQCategoryAttributes {
  Title: string;
  Slug: string;
  Description?: string;
  Order?: number;
  createdAt: string;
  updatedAt: string;
}

interface Item {
  id: number;
  attributes: FAQCategoryAttributes;
}

export const deleteFAQCategory = async (id: string): Promise<PaginatedResponse<Item>> => {
  try {
    const endpoint = `${ENDPOINTS.FAQ.CATEGORY}/${id}`;
    const response = await apiClient.delete<PaginatedResponse<Item>>(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error deleting FAQ category:", error);
    throw error;
  }
};
