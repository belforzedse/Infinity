import { type BlogCategory } from "@/services/blog/blog.service";
import { type BlogCategoryBannerOrderItem } from "@/types/super-admin/settings";
import {
  isCategoryBannerConfigured,
  isDefaultBlogBannerConfigured,
  sortBlogCategoriesByBannerOrder,
} from "../blogCategoryBanners";

const makeCategory = (overrides: Partial<BlogCategory>): BlogCategory => ({
  id: 1,
  Name: "Category",
  Title: "Category",
  Slug: "category",
  Description: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("blogCategoryBanners utils", () => {
  it("orders categories by settings order and then alphabetically for remaining items", () => {
    const categories: BlogCategory[] = [
      makeCategory({ id: 1, Title: "Zeta", Slug: "zeta" }),
      makeCategory({ id: 2, Title: "Alpha", Slug: "alpha" }),
      makeCategory({ id: 3, Title: "Beauty", Slug: "beauty" }),
    ];

    const order: BlogCategoryBannerOrderItem[] = [
      { id: 3, title: "Beauty", slug: "beauty" },
    ];

    const result = sortBlogCategoriesByBannerOrder(categories, order);
    expect(result.map((item) => item.Slug)).toEqual(["beauty", "alpha", "zeta"]);
  });

  it("falls back safely when settings order references missing categories", () => {
    const categories: BlogCategory[] = [
      makeCategory({ id: 1, Title: "Zeta", Slug: "zeta" }),
      makeCategory({ id: 2, Title: "Alpha", Slug: "alpha" }),
    ];

    const order: BlogCategoryBannerOrderItem[] = [
      { id: 99, title: "Ghost", slug: "ghost" },
    ];

    const result = sortBlogCategoriesByBannerOrder(categories, order);
    expect(result.map((item) => item.Slug)).toEqual(["alpha", "zeta"]);
  });

  it("detects when category banner config is missing", () => {
    const category = makeCategory({
      BannerTitle: "",
      BannerSubtitle: "",
      BannerLinkText: "",
      FeaturedImage: undefined,
    });

    expect(isCategoryBannerConfigured(category)).toBe(false);
  });

  it("detects when category banner config is present", () => {
    const category = makeCategory({
      BannerTitle: "عنوان",
      BannerSubtitle: "",
      BannerLinkText: "",
    });

    expect(isCategoryBannerConfigured(category)).toBe(true);
  });

  it("detects if default banner should be rendered", () => {
    expect(
      isDefaultBlogBannerConfigured({
        blogDefaultBannerImage: "",
        blogDefaultBannerTitle: "",
        blogDefaultBannerSubtitle: "",
        blogDefaultBannerLinkText: "",
      } as any),
    ).toBe(false);

    expect(
      isDefaultBlogBannerConfigured({
        blogDefaultBannerImage: "",
        blogDefaultBannerTitle: "همه مقالات",
        blogDefaultBannerSubtitle: "",
        blogDefaultBannerLinkText: "",
      } as any),
    ).toBe(true);
  });
});
