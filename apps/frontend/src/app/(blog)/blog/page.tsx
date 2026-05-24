import React from "react";
import { Metadata } from "next";
import { BlogCarousel, BlogCategoryBanner, BlogCard } from "@/components/Blog";
import { blogService, BlogPost, BlogCategory } from "@/services/blog/blog.service";
import { getPublicSuperAdminSettings } from "@/services/super-admin/settings/public";
import { generateBlogListingMetadata } from "@/utils/seo";
import {
  isCategoryBannerConfigured,
  isDefaultBlogBannerConfigured,
  sortBlogCategoriesByBannerOrder,
} from "@/utils/blogCategoryBanners";
import { getStrapiServerUrl } from "@/constants/api";
import { SITE_NAME, SITE_URL } from "@/config/site";
import resolveAssetUrl from "@/utils/resolveAssetUrl";

// Use on-demand revalidation (triggered by Strapi lifecycle hooks)
// Fallback to 1 hour if revalidation API is not called
export const revalidate = 3600; // 1 hour fallback (on-demand is primary)

const LATEST_POSTS_LIMIT = 8;
const CATEGORY_POSTS_LIMIT = 8;

const trimmed = (value?: string) => (typeof value === "string" ? value.trim() : "");

const getCategoryDisplayTitle = (category?: BlogCategory) =>
  trimmed(category?.Title) || trimmed(category?.Name) || "مقالات";

const resolveCategoryBannerData = (category: BlogCategory) => ({
  title: trimmed(category.BannerTitle) || getCategoryDisplayTitle(category),
  subtitle: trimmed(category.BannerSubtitle) || undefined,
  backgroundImage: category.FeaturedImage?.url ? resolveAssetUrl(category.FeaturedImage.url) : undefined,
  textColor: trimmed(category.BannerTitleColor) || undefined,
  subtitleColor: trimmed(category.BannerSubtitleColor) || undefined,
  linkColor: trimmed(category.BannerLinkColor) || undefined,
  linkText: trimmed(category.BannerLinkText) || "مشاهده دسته بندی",
  href: `/blog?category=${encodeURIComponent(category.Slug)}`,
});

const getPostsBySlug = (postsByCategory: Record<string, BlogPost[]>, slug?: string) => {
  if (!slug) return [];
  if (postsByCategory[slug]) return postsByCategory[slug];

  const foundKey = Object.keys(postsByCategory).find((key) => key.toLowerCase() === slug.toLowerCase());
  return foundKey ? postsByCategory[foundKey] : [];
};

async function fetchLatestPublishedPosts(): Promise<BlogPost[]> {
  try {
    const response = await blogService.getBlogPosts({
      pageSize: LATEST_POSTS_LIMIT,
      status: "Published",
      sort: "PublishedAt:desc",
    });

    return response.data || [];
  } catch (error) {
    console.error("Error fetching latest blog posts:", error);
    return [];
  }
}

async function fetchAllBlogCategories(): Promise<BlogCategory[]> {
  try {
    const response = await blogService.getBlogCategories();
    const categories = response.data || [];

    return categories.filter((category) => Boolean(trimmed(category?.Slug)));
  } catch (error) {
    console.error("Error fetching blog categories:", error);
    return [];
  }
}

async function fetchPostsForCategories(categories: BlogCategory[]): Promise<Record<string, BlogPost[]>> {
  const postsByCategory = await Promise.all(
    categories.map(async (category) => {
      if (!category.Slug) return [];

      try {
        const response = await blogService.getBlogPosts({
          pageSize: CATEGORY_POSTS_LIMIT,
          status: "Published",
          category: category.Slug,
          sort: "PublishedAt:desc",
        });

        return response.data || [];
      } catch (error) {
        console.error(`Error fetching posts for category ${category.Slug}:`, error);
        return [];
      }
    }),
  );

  const groupedByRequestedCategory = categories.reduce<Record<string, BlogPost[]>>((acc, category, index) => {
    if (category.Slug) {
      acc[category.Slug] = postsByCategory[index] || [];
    }
    return acc;
  }, {});

  // WORKAROUND: Backend category filter can be inconsistent, so regroup by actual category slug.
  const groupedByActualCategory: Record<string, BlogPost[]> = {};
  const seenPostIds = new Set<string>();

  Object.values(groupedByRequestedCategory).forEach((posts) => {
    posts.forEach((post) => {
      const categorySlug = post.blog_category?.Slug;
      const postKey = `${categorySlug}-${post.id}`;

      if (!categorySlug || seenPostIds.has(postKey)) return;

      seenPostIds.add(postKey);
      if (!groupedByActualCategory[categorySlug]) {
        groupedByActualCategory[categorySlug] = [];
      }
      groupedByActualCategory[categorySlug].push(post);
    });
  });

  return groupedByActualCategory;
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const categoryFilter = typeof params.category === "string" ? params.category : undefined;

  const [latestPosts, categories, settings] = await Promise.all([
    fetchLatestPublishedPosts(),
    fetchAllBlogCategories(),
    getPublicSuperAdminSettings(),
  ]);

  const orderedCategories = sortBlogCategoriesByBannerOrder(categories, settings.blogCategoryBannerOrder);
  const postsByCategory =
    orderedCategories.length > 0 ? await fetchPostsForCategories(orderedCategories) : {};

  if (categoryFilter) {
    const filteredCategory = orderedCategories.find(
      (category) => category.Slug.toLowerCase() === categoryFilter.toLowerCase(),
    );

    const filteredPosts = getPostsBySlug(postsByCategory, categoryFilter);
    const bannerData = filteredCategory
      ? resolveCategoryBannerData(filteredCategory)
      : {
          title: "مقالات",
          subtitle: "آخرین مطالب این دسته‌بندی",
          href: `/blog?category=${encodeURIComponent(categoryFilter)}`,
          linkText: "مشاهده دسته بندی",
          textColor: undefined,
          subtitleColor: undefined,
          linkColor: undefined,
          backgroundImage: undefined,
        };

    return (
      <div className="min-h-screen bg-slate-50" dir="rtl">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <BlogCategoryBanner
            title={bannerData.title}
            subtitle={bannerData.subtitle}
            href={bannerData.href}
            backgroundImage={bannerData.backgroundImage}
            textColor={bannerData.textColor}
            subtitleColor={bannerData.subtitleColor}
            linkColor={bannerData.linkColor}
            linkText={bannerData.linkText}
            height="lg"
          />
        </div>

        <div className="container mx-auto px-4 py-6 pb-20">
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-neutral-600">هیچ مقاله‌ای در این دسته‌بندی یافت نشد.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="bg-gradient-to-b from-pink-50 to-slate-50 py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-3xl font-bold text-neutral-900 md:text-5xl">اینفینیتی مگ</h1>
          <p className="mx-auto max-w-2xl text-base text-neutral-600 md:text-lg">
            آخرین مقالات، آموزش‌ها و بینش‌های ما را در زمینه رنگ، طراحی و دکوراسیون کشف کنید
          </p>
        </div>
      </div>

      {latestPosts.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <BlogCarousel posts={latestPosts} title="جدید ترین ها" viewAllHref="/blog" />
        </div>
      )}

      <div className="container mx-auto space-y-12 px-4 pb-16">
        {orderedCategories.map((category) => {
          const posts = getPostsBySlug(postsByCategory, category.Slug);
          if (posts.length === 0) return null;

          const bannerData = resolveCategoryBannerData(category);

          return (
            <React.Fragment key={`category-${category.id}`}>
              {isCategoryBannerConfigured(category) && (
                <BlogCategoryBanner
                  title={bannerData.title}
                  subtitle={bannerData.subtitle}
                  href={bannerData.href}
                  backgroundImage={bannerData.backgroundImage}
                  textColor={bannerData.textColor}
                  subtitleColor={bannerData.subtitleColor}
                  linkColor={bannerData.linkColor}
                  linkText={bannerData.linkText}
                  height="lg"
                />
              )}

              <BlogCarousel
                posts={posts}
                title={getCategoryDisplayTitle(category)}
                viewAllHref={`/blog?category=${encodeURIComponent(category.Slug)}`}
                isCategory
              />
            </React.Fragment>
          );
        })}

        {isDefaultBlogBannerConfigured(settings) && (
          <BlogCategoryBanner
            title={trimmed(settings.blogDefaultBannerTitle) || "همه مقالات اینفینیتی مگ"}
            subtitle={trimmed(settings.blogDefaultBannerSubtitle) || undefined}
            href="/blog"
            backgroundImage={
              trimmed(settings.blogDefaultBannerImage)
                ? resolveAssetUrl(trimmed(settings.blogDefaultBannerImage))
                : undefined
            }
            textColor={trimmed(settings.blogDefaultBannerTitleColor) || undefined}
            subtitleColor={trimmed(settings.blogDefaultBannerSubtitleColor) || undefined}
            linkColor={trimmed(settings.blogDefaultBannerLinkColor) || undefined}
            linkText={trimmed(settings.blogDefaultBannerLinkText) || "مشاهده همه مقالات"}
            height="lg"
          />
        )}
      </div>
    </div>
  );
}

/**
 * Generate metadata for blog listing page
 * Handles category filter to show proper category name in title
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const categoryFilter = typeof params.category === "string" ? params.category : undefined;

  // If category filter is present, fetch category details for proper metadata
  if (categoryFilter) {
    try {
      const endpoint = `${getStrapiServerUrl()}/blog-categories?filters[Slug][$eq]=${encodeURIComponent(categoryFilter)}&fields[0]=Title&fields[1]=Slug`;
      const response = await fetch(endpoint, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (response.ok) {
        const data = await response.json();
        const categoryData = data?.data?.[0];

        if (categoryData) {
          const categoryTitle = categoryData.attributes?.Title || categoryFilter;
          const title = `${categoryTitle} | وبلاگ`;
          const description = `مقالات دسته‌بندی ${categoryTitle} در ${SITE_NAME}. آخرین مطالب و آموزش‌ها.`;
          const url = `${SITE_URL}/blog?category=${encodeURIComponent(categoryFilter)}`;

          return {
            title,
            description,
            openGraph: {
              type: "website",
              title,
              description,
              url,
              siteName: SITE_NAME,
              images: [
                {
                  url: `${SITE_URL}/images/og-default.jpg`,
                  width: 1200,
                  height: 630,
                  alt: `${categoryTitle} | ${SITE_NAME}`,
                },
              ],
            },
            twitter: {
              card: "summary_large_image",
              title,
              description,
              images: [`${SITE_URL}/images/og-default.jpg`],
            },
            alternates: {
              canonical: url,
            },
          };
        }
      }
    } catch (error) {
      console.error("[Blog Metadata] Error fetching category:", error);
    }
  }

  // Default blog listing metadata (no category filter)
  return generateBlogListingMetadata();
}
