import { apiClient } from "@/services";
import type { SuperAdminSettings } from "@/types/super-admin/settings";
import { defaultSettings, normalizeSuperAdminSettings } from "@/types/super-admin/settings";

export async function getSuperAdminSettings(): Promise<SuperAdminSettings> {
  try {
    const res = await apiClient.get("/settings?populate=*");
    const raw = (res as { data?: { id?: number; attributes?: Record<string, unknown>; createdAt?: string; updatedAt?: string } })?.data;
    if (!raw) return defaultSettings();

    const data = {
      ...(raw.attributes ?? {}),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
    return normalizeSuperAdminSettings(data, raw.id ?? 1);
  } catch (error: any) {
    if (error && (error.status === 404 || error.response?.status === 404)) {
      return defaultSettings();
    }
    throw error;
  }
}
