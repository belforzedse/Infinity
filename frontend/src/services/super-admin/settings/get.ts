import { apiClient } from "@/services";
import type { SuperAdminSettings } from "@/types/super-admin/settings";
import { defaultSettings, normalizeSuperAdminSettings } from "@/types/super-admin/settings";

export async function getSuperAdminSettings(): Promise<SuperAdminSettings> {
  try {
    const res = await apiClient.get("/settings?populate=*");
    const data = (res as any)?.data?.attributes;
    if (!data) return defaultSettings();

    return normalizeSuperAdminSettings(data, (res as any).data?.id || 1);
  } catch (error: any) {
    if (error && (error.status === 404 || error.response?.status === 404)) {
      return defaultSettings();
    }
    throw error;
  }
}
