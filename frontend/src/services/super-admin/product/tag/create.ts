import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import logger from "@/utils/logger";

interface TagAttributes {
  Title: string;
  createdAt: string;
  updatedAt: string;
}

interface TagData {
  id: number;
  attributes: TagAttributes;
}

export interface TagResponse {
  data: TagData;
  meta: Record<string, unknown>;
}

export const createTag = async (title: string): Promise<ApiResponse<TagResponse>> => {
  const endpoint = ENDPOINTS.PRODUCT.TAG;

  try {
    const response = await apiClient.post<ApiResponse<TagResponse>>(endpoint, {
      data: { Title: title },
    });

    // Log the response for debugging
    if (process.env.NODE_ENV !== "production") {
      logger.info("API response for tag creation", { response: response.data });
    }

    return response.data;
  } catch (error) {
    console.error("Error in createTag API call:", error);
    throw error;
  }
};
