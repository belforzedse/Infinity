import { apiClient } from "@/services";
import type { SuperAdminSettings } from "@/types/super-admin/settings";

export async function updateSuperAdminSettings(
  settings: Partial<SuperAdminSettings>,
): Promise<void> {
  // PUT to /settings with data object
  await apiClient.put(`/settings`, {
    data: {
      filterPublicProductsByTitle: Boolean(settings.filterPublicProductsByTitle),
    },
  });
}
