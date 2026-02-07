import { updateSuperAdminSettings } from "./update";
import { apiClient } from "@/services";

jest.mock("@/services", () => ({
  apiClient: {
    put: jest.fn(),
  },
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
    });

    expect(putMock).toHaveBeenCalledWith("/settings", {
      data: {
        homeFeaturedCategorySlug: "featured-slug",
        homeFeaturedCategoryBannerImage: "/uploads/featured-banner.jpg",
      },
    });
  });

  it("should not call API when no updatable fields are provided", async () => {
    await updateSuperAdminSettings({});

    expect(putMock).not.toHaveBeenCalled();
  });
});
