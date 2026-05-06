import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import { FAQCategory } from "@/types/faq";
import type { FAQCategoryData } from "./createCategory";

export const updateFAQCategory = async (
  id: string | number,
  data: FAQCategoryData,
): Promise<ApiResponse<FAQCategory>> => {
  const endpoint = `${ENDPOINTS.FAQ.CATEGORY}/${id}`;
  const response = await apiClient.put<ApiResponse<FAQCategory>>(endpoint, {
    data,
  });
  return response.data;
};
