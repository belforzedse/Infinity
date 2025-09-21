import { apiClient } from "@/services";
import { ENDPOINTS, STRAPI_TOKEN } from "@/constants/api";
import type { ProductData } from "@/types/super-admin/products";
import { toast } from "react-hot-toast";

interface TransformedProductData
  extends Omit<ProductData, "product_main_category" | "product_tags" | "product_other_categories"> {
  product_main_category: number | null;
  product_tags: number[];
  product_other_categories: number[];
}

function transformProductDataForApi(data: ProductData): TransformedProductData {
  return {
    ...data,
    product_main_category: data.product_main_category?.id || null,
    product_tags: data.product_tags.map((tag) => tag.id),
    product_other_categories: data.product_other_categories.map((category) => category.id),
  };
}

export const createProduct = async (body: ProductData) => {
  try {
    const endpoint = `${ENDPOINTS.PRODUCT.PRODUCT}`;
    const transformedBody = transformProductDataForApi(body);

    const response = await apiClient.post(
      endpoint,
      {
        data: transformedBody,
      },
      {
        headers: {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
      },
    );

    return { success: true, data: response.data };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || "ساخت محصول با خطا مواجه شد";
    toast.error(errorMessage);
    return { success: false, error };
  }
};
