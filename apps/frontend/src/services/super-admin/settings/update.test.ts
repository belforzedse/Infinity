import { updateSuperAdminSettings } from "./update";
import { apiClient } from "@/services";

jest.mock("@/services", () => ({
  apiClient: {
    put: jest.fn(),
  },
}));

jest.mock("./get", () => ({
  normalizeSettingsApiResponse: jest.fn(() => null),
}));

const putMock = apiClient.put as jest.Mock;

describe("updateSuperAdminSettings", () => {
  beforeEach(() => {
    putMock.mockReset();
  });

  it("should include featured category fields in update payload", async () => {
    putMock.mockResolvedValueOnce({});

    await updateSuperAdminSettings({
      homeFeaturedCategorySlug: "featured-slug",
      homeFeaturedCategoryBannerImage: "/uploads/featured-banner.jpg",
      homeFeaturedCategoryTitle: "Featured",
      homeFeaturedCategoryDesktopBannerHeight: 360,
    });

    expect(putMock).toHaveBeenCalledWith("/settings?populate=*", {
      data: {
        homeFeaturedCategorySlug: "featured-slug",
        homeFeaturedCategoryBannerImage: "/uploads/featured-banner.jpg",
        homeFeaturedCategoryTitle: "Featured",
        homeFeaturedCategoryDesktopBannerHeight: 360,
      },
    });
  });

  it("should include promo banner style fields in update payload", async () => {
    putMock.mockResolvedValueOnce({});

    await updateSuperAdminSettings({
      homeBannerOneSubtitle: "Subtitle",
      homeBannerOneTextSize: 34,
      homeBannerOneTextAlign: "center",
      homeBannerOneDesktopHeight: 240,
      homeBannerTwoBackgroundColor: "#f8fafc",
      homeBannerTwoImageFit: "contain",
      homeBannerTwoMobileHeight: 260,
    });

    expect(putMock).toHaveBeenCalledWith("/settings?populate=*", {
      data: {
        homeBannerOneSubtitle: "Subtitle",
        homeBannerOneTextSize: 34,
        homeBannerOneTextAlign: "center",
        homeBannerOneDesktopHeight: 240,
        homeBannerTwoBackgroundColor: "#f8fafc",
        homeBannerTwoImageFit: "contain",
        homeBannerTwoMobileHeight: 260,
      },
    });
  });

  it("should not call API when no updatable fields are provided", async () => {
    await updateSuperAdminSettings({});

    expect(putMock).not.toHaveBeenCalled();
  });
});
