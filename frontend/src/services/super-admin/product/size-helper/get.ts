import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
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

  const response = await apiClient.get<ApiResponse<SizeHelperData[]>>(endpoint);

  // Return the full ApiResponse so callers can access both data and meta
  return response;
};
