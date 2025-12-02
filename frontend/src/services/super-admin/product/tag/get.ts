import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
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
    const response = await apiClient.get<PaginatedResponse<TagResponseType>>(endpoint);

    return response.data;
  } catch (error) {
    console.error("Failed to get product tags:", error);
    throw error;
  }
};
