import { apiClient } from "@/services";
import type { Navigation } from "@/types/super-admin/navigation";

export async function getNavigation(): Promise<Navigation> {
  const response = await apiClient.get("/navigation?populate=*");

  const navigationData = (response as any).data.attributes;

  return {
    id: (response as any).data.id || 1,
    product_categories: (navigationData.product_categories?.data || []).map(
      (category: { id: number; attributes: { Title: string; Slug: string } }) => ({
        id: category.id,
        title: category.attributes.Title || "",
        slug: category.attributes.Slug || "",
      }),
    ),
    createdAt: new Date(navigationData.createdAt || Date.now()),
    updatedAt: new Date(navigationData.updatedAt || Date.now()),
  };
}
