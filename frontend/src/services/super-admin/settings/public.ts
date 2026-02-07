import { API_BASE_URL } from "@/constants/api";
import type { SuperAdminSettings } from "@/types/super-admin/settings";
import { defaultSettings, normalizeSuperAdminSettings } from "@/types/super-admin/settings";
import logger from "@/utils/logger";

export async function getPublicSuperAdminSettings(): Promise<SuperAdminSettings> {
  try {
    const response = await fetch(`${API_BASE_URL}/site-settings?populate=*`, {
      next: { revalidate: 60 },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }).then((res) => res.json());

    const data = (response as any)?.data?.attributes;
    if (!data) return defaultSettings();

    return normalizeSuperAdminSettings(data, (response as any).data?.id || 1);
  } catch (error) {
    logger.error("[Settings] Error fetching public settings:", error as any);
    return defaultSettings();
  }
}
