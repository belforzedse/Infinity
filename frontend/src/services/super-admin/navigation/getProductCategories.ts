import { apiClient } from "@/services";
import { STRAPI_TOKEN, ENDPOINTS } from "@/constants/api";

export interface ProductCategory {
  id: number;
  title: string;
  slug: string;
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  const response = await apiClient.get(ENDPOINTS.PRODUCT.CATEGORY, {
    headers: {
      Authorization: `Bearer ${STRAPI_TOKEN}`,
    },
  });

  const categories = (response as any).data || [];

  return categories.map((category: any) => ({
    id: category.id,
    title: category.attributes.Title || "",
    slug: category.attributes.Slug || "",
  }));
}
