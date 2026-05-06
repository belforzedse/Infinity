import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import type { ApiResponse } from "@/types/api";

interface CreateSizeHelperData {
  product: number;
  Helper: any;
}

export const createProductSizeHelper = async (
  data: CreateSizeHelperData,
): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>(ENDPOINTS.PRODUCT.SIZE_HELPER, {
    data,
  });

  return response.data;
};

export const updateProductSizeHelper = async (
  id: number,
  data: CreateSizeHelperData,
): Promise<ApiResponse<any>> => {
  const response = await apiClient.put<ApiResponse<any>>(
    `${ENDPOINTS.PRODUCT.SIZE_HELPER}/${id}`,
    {
      data,
    },
  );

  return response.data;
};
