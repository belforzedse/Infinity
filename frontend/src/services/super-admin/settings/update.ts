import { apiClient } from "@/services";
import type { SuperAdminSettings } from "@/types/super-admin/settings";

export async function updateSuperAdminSettings(
  settings: Partial<SuperAdminSettings>,
): Promise<void> {
  const data: Partial<SuperAdminSettings> = {};

  if (typeof settings.filterPublicProductsByTitle === "boolean") {
    data.filterPublicProductsByTitle = settings.filterPublicProductsByTitle;
  }

  if (settings.homeBannerOneImage !== undefined) data.homeBannerOneImage = settings.homeBannerOneImage;
  if (settings.homeBannerOneTitle !== undefined) data.homeBannerOneTitle = settings.homeBannerOneTitle;
  if (settings.homeBannerOneTitleColor !== undefined) {
    data.homeBannerOneTitleColor = settings.homeBannerOneTitleColor;
  }
  if (settings.homeBannerOneButtonText !== undefined) {
    data.homeBannerOneButtonText = settings.homeBannerOneButtonText;
  }
  if (settings.homeBannerOneButtonColor !== undefined) {
    data.homeBannerOneButtonColor = settings.homeBannerOneButtonColor;
  }
  if (settings.homeBannerOneButtonHref !== undefined) {
    data.homeBannerOneButtonHref = settings.homeBannerOneButtonHref;
  }

  if (settings.homeBannerTwoImage !== undefined) data.homeBannerTwoImage = settings.homeBannerTwoImage;
  if (settings.homeBannerTwoTitle !== undefined) data.homeBannerTwoTitle = settings.homeBannerTwoTitle;
  if (settings.homeBannerTwoTitleColor !== undefined) {
    data.homeBannerTwoTitleColor = settings.homeBannerTwoTitleColor;
  }
  if (settings.homeBannerTwoButtonText !== undefined) {
    data.homeBannerTwoButtonText = settings.homeBannerTwoButtonText;
  }
  if (settings.homeBannerTwoButtonColor !== undefined) {
    data.homeBannerTwoButtonColor = settings.homeBannerTwoButtonColor;
  }
  if (settings.homeBannerTwoButtonHref !== undefined) {
    data.homeBannerTwoButtonHref = settings.homeBannerTwoButtonHref;
  }

  if (Object.keys(data).length === 0) return;

  // PUT to /settings with data object
  await apiClient.put(`/settings`, {
    data,
  });
}
