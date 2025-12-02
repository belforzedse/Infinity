import { apiClient } from "../index";
import { ENDPOINTS } from "@/constants/api";

/**
 * Submit a product review
 *
 * @param productId - The ID of the product to review
 * @param rate - The rating (1-5) for the product
 * @param content - The review content/comment
 * @returns The response from the API
 */
export const submitProductReview = async (productId: string, rate: number, content: string) => {
  const endpoint = ENDPOINTS.PRODUCT.REVIEWS.SUBMIT;
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    throw new Error("Authentication required");
  }

  try {
    const response = await apiClient.post(
      endpoint,
      {
        productId,
        rate,
        content,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response as any;
  } catch (error: any) {
    console.error("Error submitting product review:", error);
    throw error;
  }
};
