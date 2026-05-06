import { apiClient } from "@/services";
import type { Navigation } from "@/types/super-admin/navigation";

export async function getNavigation(): Promise<Navigation> {
  const emptyNavigation: Navigation = {
    id: 1,
    product_categories: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const response = await apiClient.get("/navigation?populate=*");
    const navigationEntry = (response as any)?.data;
    const navigationData = navigationEntry?.attributes;

    if (!navigationEntry || !navigationData) {
      return emptyNavigation;
    }

    return {
      id: navigationEntry.id || 1,
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
  } catch (error: any) {
    if (error?.status === 404) {
      return emptyNavigation;
    }
    throw error;
  }
}
