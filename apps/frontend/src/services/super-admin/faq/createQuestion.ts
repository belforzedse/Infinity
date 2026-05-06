import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import { FAQQuestion } from "@/types/faq";

export interface FAQQuestionData {
  Question: string;
  Answer: string;
  Order?: number;
  IsActive?: boolean;
  faq_category?: number | null;
}

export const createFAQQuestion = async (
  question: FAQQuestionData,
): Promise<ApiResponse<FAQQuestion>> => {
  const endpoint = ENDPOINTS.FAQ.QUESTION;

  try {
    const response = await apiClient.post<ApiResponse<FAQQuestion>>(endpoint, {
      data: question,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating FAQ question:", error);
    throw error;
  }
};
