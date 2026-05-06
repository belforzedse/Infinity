import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import type { ApiResponse } from "@/types/api";

export interface CategoryDetail {
  id: number;
  attributes: {
    Title: string;
    Slug: string;
    Parent?: string | null;
    Color?: string | null;
    Image?: {
      data?: {
        id: number;
        attributes?: {
          url?: string;
          alternativeText?: string | null;
          formats?: {
            thumbnail?: { url?: string };
            small?: { url?: string };
            medium?: { url?: string };
            large?: { url?: string };
          } | null;
        };
      } | null;
    };
    parent?: {
      data: {
        id: number;
        attributes: {
          Title?: string;
        };
      } | null;
    };
    createdAt: string;
    updatedAt: string;
  };
}

export const getCategoryById = async (
  id: string | number,
): Promise<CategoryDetail> => {
  const endpoint = `${ENDPOINTS.PRODUCT.CATEGORY}/${id}?populate[0]=parent&populate[1]=Image`;
  const response = await apiClient.get<CategoryDetail>(endpoint);
  return response.data;
};
