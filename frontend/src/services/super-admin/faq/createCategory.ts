import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import { FAQCategory } from "@/types/faq";

export interface FAQCategoryData {
  Title: string;
  Slug: string;
  Description?: string;
  Order?: number;
}

export const createFAQCategory = async (
  category: FAQCategoryData,
): Promise<ApiResponse<FAQCategory>> => {
  const endpoint = ENDPOINTS.FAQ.CATEGORY;

  try {
    const response = await apiClient.post<ApiResponse<FAQCategory>>(endpoint, {
      data: category,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating FAQ category:", error);
    throw error;
  }
};
