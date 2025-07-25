import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";
import { Navigation } from "@/types/super-admin/navigation";

export async function updateNavigation(navigation: Navigation): Promise<void> {
  const categoryIds = navigation.product_categories.map(
    (category) => category.id
  );

  await apiClient.put(
    `/navigation`,
    {
      data: {
        product_categories: categoryIds,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
    }
  );
}
