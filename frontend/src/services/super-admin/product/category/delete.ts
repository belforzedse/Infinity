import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";

export interface DeleteCategoryResult {
  success: boolean;
  reassignedCount: number;
}

export const deleteCategory = async (
  id: string,
  targetCategoryId: number,
): Promise<DeleteCategoryResult> => {
  const endpoint = `${ENDPOINTS.PRODUCT.CATEGORY}/${id}/delete-with-reassign`;
  const response = await apiClient.post<{ data: DeleteCategoryResult }>(endpoint, {
    targetCategoryId,
  });
  const res = response.data as { data?: DeleteCategoryResult };
  return (res?.data ?? res) as DeleteCategoryResult;
};
