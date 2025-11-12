import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import type { CategoryData } from "./create";

export const updateCategory = async (
  id: string | number,
  data: CategoryData,
): Promise<ApiResponse<any>> => {
  const endpoint = `${ENDPOINTS.PRODUCT.CATEGORY}/${id}`;
  const response = await apiClient.put<ApiResponse<any>>(endpoint, {
    data,
  });
  return response.data;
};
