import { defaultSettings, normalizeSuperAdminSettings } from "./settings";

describe("super-admin settings type helpers", () => {
  it("should include featured category defaults", () => {
    const settings = defaultSettings();

    expect(settings.homeFeaturedCategorySlug).toBe("");
    expect(settings.homeFeaturedCategoryBannerImage).toBe("");
  });

  it("should normalize featured category fields from API payload", () => {
    const settings = normalizeSuperAdminSettings(
      {
        homeFeaturedCategorySlug: "summer-collection",
        homeFeaturedCategoryBannerImage: "/uploads/banner.jpg",
      },
      2,
    );

    expect(settings.id).toBe(2);
    expect(settings.homeFeaturedCategorySlug).toBe("summer-collection");
    expect(settings.homeFeaturedCategoryBannerImage).toBe("/uploads/banner.jpg");
  });

  it("should fallback featured category fields to empty string when payload is invalid", () => {
    const settings = normalizeSuperAdminSettings({
      homeFeaturedCategorySlug: null,
      homeFeaturedCategoryBannerImage: 12345,
    });

    expect(settings.homeFeaturedCategorySlug).toBe("");
    expect(settings.homeFeaturedCategoryBannerImage).toBe("");
  });
});
