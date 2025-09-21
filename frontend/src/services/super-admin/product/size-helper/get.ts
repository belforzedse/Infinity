import { apiClient } from "@/services";
import { ENDPOINTS, STRAPI_TOKEN } from "@/constants/api";
import type { ApiResponse } from "@/types/api";

export interface SizeHelperData {
  id: number;
  attributes: {
    product: {
      data: {
        id: number;
      };
    };
    Helper: any;
    createdAt: string;
    updatedAt: string;
  };
}

export const getProductSizeHelper = async (
  productId: number,
): Promise<ApiResponse<SizeHelperData[]>> => {
  const endpoint = `${ENDPOINTS.PRODUCT.SIZE_HELPER}?filters[product][id][$eq]=${productId}`;

  const response = await apiClient.get<ApiResponse<SizeHelperData[]>>(endpoint, {
    headers: {
      Authorization: `Bearer ${STRAPI_TOKEN}`,
    },
  });

  return response.data;
};
