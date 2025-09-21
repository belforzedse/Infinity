import { apiClient } from "@/services";
import { ENDPOINTS, STRAPI_TOKEN } from "@/constants/api";
import type { PaginatedResponse } from "@/types/api";

export interface TagAttributes {
  Title: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagResponseType {
  id: number;
  attributes: TagAttributes;
}

export const getTags = async (): Promise<PaginatedResponse<TagResponseType>> => {
  const endpoint = `${ENDPOINTS.PRODUCT.TAG}`;

  try {
    const response = await apiClient.get<PaginatedResponse<TagResponseType>>(endpoint, {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to get product tags:", error);
    throw error;
  }
};
