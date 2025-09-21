import { apiClient } from "@/services";
import { SuperAdminSettings, defaultSettings } from "@/types/super-admin/settings";

export async function getSuperAdminSettings(): Promise<SuperAdminSettings> {
  try {
    const res = await apiClient.get("/settings?populate=*");
    const data = (res as any)?.data?.attributes;
    if (!data) return defaultSettings();

    return {
      id: (res as any).data?.id || 1,
      filterPublicProductsByTitle: Boolean(data.filterPublicProductsByTitle) || false,
      createdAt: new Date(data.createdAt || Date.now()),
      updatedAt: new Date(data.updatedAt || Date.now()),
    };
  } catch (error: any) {
    if (error && (error.status === 404 || error.response?.status === 404)) {
      return defaultSettings();
    }
    throw error;
  }
}
