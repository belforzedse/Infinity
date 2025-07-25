import { apiClient } from "@/services";
import { ENDPOINTS, STRAPI_TOKEN } from "@/constants/api";
import { ApiResponse } from "@/types/api";

interface CreateSizeHelperData {
  product: number;
  Helper: any;
}

export const createProductSizeHelper = async (
  data: CreateSizeHelperData
): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>(
    ENDPOINTS.PRODUCT.SIZE_HELPER,
    { data },
    {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
    }
  );

  return response.data;
};

export const updateProductSizeHelper = async (
  id: number,
  data: CreateSizeHelperData
): Promise<ApiResponse<any>> => {
  const response = await apiClient.put<ApiResponse<any>>(
    `${ENDPOINTS.PRODUCT.SIZE_HELPER}/${id}`,
    { data },
    {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
    }
  );

  return response.data;
};
