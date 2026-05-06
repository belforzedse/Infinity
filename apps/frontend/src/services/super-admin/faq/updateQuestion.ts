import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import type { ApiResponse } from "@/types/api";
import { FAQQuestion } from "@/types/faq";
import type { FAQQuestionData } from "./createQuestion";

export const updateFAQQuestion = async (
  id: string | number,
  data: FAQQuestionData,
): Promise<ApiResponse<FAQQuestion>> => {
  const endpoint = `${ENDPOINTS.FAQ.QUESTION}/${id}`;
  const response = await apiClient.put<ApiResponse<FAQQuestion>>(endpoint, {
    data,
  });
  return response.data;
};
