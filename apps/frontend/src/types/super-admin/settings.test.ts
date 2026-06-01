import { defaultSettings, normalizeSuperAdminSettings } from "./settings";
import { HERO_SLIDER_VERSION } from "./heroSlider";

describe("super-admin settings type helpers", () => {
  it("should include featured category defaults", () => {
    const settings = defaultSettings();

    expect(settings.homeFeaturedCategorySlug).toBe("");
    expect(settings.homeFeaturedCategoryBannerImage).toBe("");
    expect(settings.homeFeaturedCategoryTitle).toBe("");
    expect(settings.homeFeaturedCategoryCtaText).toBe("");
    expect(settings.homeFeaturedCategoryBannerImageFit).toBe("cover");
    expect(settings.homeFeaturedCategoryDesktopBannerHeight).toBe(340);
    expect(settings.homeBannerOneSubtitle).toBe("");
    expect(settings.homeBannerOneTextSize).toBe(30);
    expect(settings.homeBannerOneTextAlign).toBe("right");
    expect(settings.homeBannerOneDesktopHeight).toBe(220);
    expect(settings.homeBannerTwoSubtitle).toBe("");
    expect(settings.homeBannerTwoTextSize).toBe(30);
    expect(settings.homeBannerTwoTextAlign).toBe("right");
    expect(settings.homeBannerTwoDesktopHeight).toBe(220);
    expect(settings.blogDefaultBannerImage).toBe("");
    expect(settings.blogDefaultBannerTitle).toBe("");
    expect(settings.blogDefaultBannerSubtitle).toBe("");
    expect(settings.blogDefaultBannerTitleColor).toBe("");
    expect(settings.blogDefaultBannerSubtitleColor).toBe("");
    expect(settings.blogDefaultBannerLinkText).toBe("");
    expect(settings.blogDefaultBannerLinkColor).toBe("");
    expect(settings.blogCategoryBannerOrder).toEqual([]);
    expect(settings.homeHeroSliderDraft.version).toBe(HERO_SLIDER_VERSION);
    expect(settings.homeHeroSliderDraft.slides).toEqual([]);
    expect(settings.homeHeroSliderPublished.slides).toEqual([]);
    expect(settings.homeHeroSliderMeta).toBeNull();
  });

  it("should normalize featured category fields from API payload", () => {
    const settings = normalizeSuperAdminSettings(
      {
        homeFeaturedCategorySlug: "summer-collection",
        homeFeaturedCategoryBannerImage: "/uploads/banner.jpg",
        homeFeaturedCategoryTitle: "Special picks",
        homeFeaturedCategoryCtaText: "Shop all",
        homeFeaturedCategoryBannerImageFit: "contain",
        homeFeaturedCategoryDesktopBannerHeight: 360,
        homeBannerOneSubtitle: "Banner subtitle",
        homeBannerOneTextSize: 34,
        homeBannerOneTextAlign: "center",
        homeBannerOneDesktopHeight: 240,
        homeBannerTwoSubtitle: "Second subtitle",
        homeBannerTwoTextSize: 28,
        homeBannerTwoTextAlign: "left",
        homeBannerTwoDesktopHeight: 210,
        blogDefaultBannerImage: "/uploads/blog-default.jpg",
        blogDefaultBannerTitle: "همه مقالات",
        blogDefaultBannerSubtitle: "مرور مقالات",
        blogDefaultBannerTitleColor: "#ffffff",
        blogDefaultBannerSubtitleColor: "#e5e7eb",
        blogDefaultBannerLinkText: "مشاهده همه",
        blogDefaultBannerLinkColor: "#ffffff",
        blogCategoryBannerOrder: [
          { id: 12, title: "Beauty", slug: "beauty" },
          { id: 11, title: "Cooking", slug: "cooking" },
        ],
      },
      2,
    );

    expect(settings.id).toBe(2);
    expect(settings.homeFeaturedCategorySlug).toBe("summer-collection");
    expect(settings.homeFeaturedCategoryBannerImage).toBe("/uploads/banner.jpg");
    expect(settings.homeFeaturedCategoryTitle).toBe("Special picks");
    expect(settings.homeFeaturedCategoryCtaText).toBe("Shop all");
    expect(settings.homeFeaturedCategoryBannerImageFit).toBe("contain");
    expect(settings.homeFeaturedCategoryDesktopBannerHeight).toBe(360);
    expect(settings.homeBannerOneSubtitle).toBe("Banner subtitle");
    expect(settings.homeBannerOneTextSize).toBe(34);
    expect(settings.homeBannerOneTextAlign).toBe("center");
    expect(settings.homeBannerOneDesktopHeight).toBe(240);
    expect(settings.homeBannerTwoSubtitle).toBe("Second subtitle");
    expect(settings.homeBannerTwoTextSize).toBe(28);
    expect(settings.homeBannerTwoTextAlign).toBe("left");
    expect(settings.homeBannerTwoDesktopHeight).toBe(210);
    expect(settings.blogDefaultBannerImage).toBe("/uploads/blog-default.jpg");
    expect(settings.blogDefaultBannerTitle).toBe("همه مقالات");
    expect(settings.blogDefaultBannerSubtitle).toBe("مرور مقالات");
    expect(settings.blogDefaultBannerTitleColor).toBe("#ffffff");
    expect(settings.blogDefaultBannerSubtitleColor).toBe("#e5e7eb");
    expect(settings.blogDefaultBannerLinkText).toBe("مشاهده همه");
    expect(settings.blogDefaultBannerLinkColor).toBe("#ffffff");
    expect(settings.blogCategoryBannerOrder).toEqual([
      { id: 12, title: "Beauty", slug: "beauty" },
      { id: 11, title: "Cooking", slug: "cooking" },
    ]);
    expect(settings.homeHeroSliderDraft.version).toBe(HERO_SLIDER_VERSION);
    expect(settings.homeHeroSliderPublished.version).toBe(HERO_SLIDER_VERSION);
  });

  it("should fallback featured category fields to empty string when payload is invalid", () => {
    const settings = normalizeSuperAdminSettings({
      homeFeaturedCategorySlug: null,
      homeFeaturedCategoryBannerImage: 12345,
      homeFeaturedCategoryTitle: false,
      homeFeaturedCategoryBannerImageFit: "stretch",
      homeFeaturedCategoryDesktopBannerHeight: "bad",
      homeBannerOneTextAlign: "middle",
      homeBannerOneTextSize: "bad",
      homeBannerOneImageFit: "stretch",
      blogDefaultBannerImage: null,
      blogDefaultBannerTitle: 999,
      blogDefaultBannerSubtitle: false,
      blogDefaultBannerTitleColor: null,
      blogDefaultBannerSubtitleColor: {},
      blogDefaultBannerLinkText: [],
      blogDefaultBannerLinkColor: 123,
      blogCategoryBannerOrder: [
        { id: 1, title: "One", slug: "one" },
        { id: "2", title: "Two", slug: "two" },
        { id: 3, title: "Duplicate", slug: "one" },
        { id: "bad", title: "Bad", slug: "bad" },
      ],
    });

    expect(settings.homeFeaturedCategorySlug).toBe("");
    expect(settings.homeFeaturedCategoryBannerImage).toBe("");
    expect(settings.homeFeaturedCategoryTitle).toBe("");
    expect(settings.homeFeaturedCategoryBannerImageFit).toBe("cover");
    expect(settings.homeFeaturedCategoryDesktopBannerHeight).toBe(340);
    expect(settings.homeBannerOneTextAlign).toBe("right");
    expect(settings.homeBannerOneTextSize).toBe(30);
    expect(settings.homeBannerOneImageFit).toBe("cover");
    expect(settings.blogDefaultBannerImage).toBe("");
    expect(settings.blogDefaultBannerTitle).toBe("");
    expect(settings.blogDefaultBannerSubtitle).toBe("");
    expect(settings.blogDefaultBannerTitleColor).toBe("");
    expect(settings.blogDefaultBannerSubtitleColor).toBe("");
    expect(settings.blogDefaultBannerLinkText).toBe("");
    expect(settings.blogDefaultBannerLinkColor).toBe("");
    expect(settings.blogCategoryBannerOrder).toEqual([
      { id: 1, title: "One", slug: "one" },
      { id: 2, title: "Two", slug: "two" },
    ]);
    expect(settings.homeHeroSliderDraft.slides).toEqual([]);
    expect(settings.homeHeroSliderPublished.slides).toEqual([]);
  });
});
