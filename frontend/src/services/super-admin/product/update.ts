import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import type { EditProductData, ProductData } from "@/types/super-admin/products";

interface TransformedProductData
  extends Omit<
    ProductData,
    | "product_main_category"
    | "product_tags"
    | "product_other_categories"
    | "Media"
    | "Files"
    | "CoverImage"
  > {
  product_main_category: number | null;
  product_tags: number[];
  product_other_categories: number[];
  CoverImage?: number | null;
  Media?: number[];
  Files?: number[];
}

function transformProductDataForApi(data: EditProductData): TransformedProductData {
  // Create a new object without the CoverImage field
  const { CoverImage, ...rest } = data;

  const transformedData: TransformedProductData = {
    ...rest,
    Media: data.Media?.map((media) => +media.id),
    Files: data.Files?.map((file) => +file.id),
    product_main_category: data.product_main_category?.id || null,
    product_tags: data.product_tags.map((tag) => tag.id),
    product_other_categories: data.product_other_categories.map((category) => category.id),
  };

  // Handle CoverImage: include ID if exists, or null if explicitly deleted
  // Check if CoverImage is explicitly set (either null or has data property)
  if (CoverImage === null || (CoverImage && CoverImage.data === null)) {
    // CoverImage is explicitly set to null or CoverImage.data is null (deleted)
    transformedData.CoverImage = null;
  } else if (CoverImage?.data?.id) {
    // CoverImage has a valid ID
    transformedData.CoverImage = CoverImage.data.id;
  }
  // If CoverImage is undefined, don't include it in the payload (no change)

  return transformedData;
}

export const updateProduct = async (id: string, body: EditProductData) => {
  try {
    const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}/${id}`;
    const transformedBody = transformProductDataForApi(body);

    const response = await apiClient.put(endpoint, {
      data: transformedBody,
    });

    return { success: true, data: response.data };
  } catch (error: any) {
    // Return error without showing toast - let the caller handle it
    return {
      success: false,
      error,
      errorMessage: error.response?.data?.error?.message || "ویرایش محصول با خطا مواجه شد"
    };
  }
};
