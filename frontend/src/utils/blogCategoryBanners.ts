import type { BlogCategory } from "@/services/blog/blog.service";
import type { BlogCategoryBannerOrderItem, SuperAdminSettings } from "@/types/super-admin/settings";

const trimmed = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const categoryLabel = (category: BlogCategory) =>
  trimmed(category.Title) || trimmed(category.Name) || trimmed(category.Slug);

export function isCategoryBannerConfigured(
  category: Pick<BlogCategory, "BannerTitle" | "BannerSubtitle" | "BannerLinkText" | "FeaturedImage">,
): boolean {
  return Boolean(
    trimmed(category.BannerTitle) ||
      trimmed(category.BannerSubtitle) ||
      trimmed(category.BannerLinkText) ||
      trimmed(category.FeaturedImage?.url),
  );
}

export function sortBlogCategoriesByBannerOrder(
  categories: BlogCategory[],
  order: BlogCategoryBannerOrderItem[],
): BlogCategory[] {
  if (categories.length === 0) return [];

  const categoryBySlug = new Map<string, BlogCategory>();
  for (const category of categories) {
    const slug = trimmed(category.Slug);
    if (!slug) continue;
    categoryBySlug.set(slug.toLowerCase(), category);
  }

  const ordered: BlogCategory[] = [];
  const usedSlugs = new Set<string>();

  for (const item of order) {
    const slugKey = trimmed(item.slug).toLowerCase();
    if (!slugKey || usedSlugs.has(slugKey)) continue;
    const category = categoryBySlug.get(slugKey);
    if (!category) continue;
    usedSlugs.add(slugKey);
    ordered.push(category);
  }

  const remaining = categories
    .filter((category) => {
      const slug = trimmed(category.Slug).toLowerCase();
      return slug && !usedSlugs.has(slug);
    })
    .sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b), "fa"));

  return [...ordered, ...remaining];
}

export function isDefaultBlogBannerConfigured(
  settings: Pick<
    SuperAdminSettings,
    "blogDefaultBannerImage" | "blogDefaultBannerTitle" | "blogDefaultBannerSubtitle" | "blogDefaultBannerLinkText"
  >,
): boolean {
  return Boolean(
    trimmed(settings.blogDefaultBannerImage) ||
      trimmed(settings.blogDefaultBannerTitle) ||
      trimmed(settings.blogDefaultBannerSubtitle) ||
      trimmed(settings.blogDefaultBannerLinkText),
  );
}
