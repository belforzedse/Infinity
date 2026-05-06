import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import type { PaginatedResponse } from "@/types/api";

export interface FAQQuestionAttributes {
  Question: string;
  Answer: string;
  Order?: number;
  IsActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Item {
  id: number;
  attributes: FAQQuestionAttributes;
}

export const deleteFAQQuestion = async (id: string): Promise<PaginatedResponse<Item>> => {
  try {
    const endpoint = `${ENDPOINTS.FAQ.QUESTION}/${id}`;
    const response = await apiClient.delete<PaginatedResponse<Item>>(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error deleting FAQ question:", error);
    throw error;
  }
};
