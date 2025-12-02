import { apiClient } from "@/services";
import type { Navigation } from "@/types/super-admin/navigation";

export async function updateNavigation(navigation: Navigation): Promise<void> {
  const categoryIds = navigation.product_categories.map((category) => category.id);

  await apiClient.put(`/navigation`, {
    data: {
      product_categories: categoryIds,
    },
  });
}
