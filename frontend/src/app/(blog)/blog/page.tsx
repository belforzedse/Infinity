import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { BlogCarousel, BlogCategoryBanner, BlogCard } from "@/components/Blog";
import { blogService, BlogPost, BlogCategory } from "@/services/blog/blog.service";
import { generateBlogListingMetadata } from "@/utils/seo";
import { API_BASE_URL } from "@/constants/api";
import { SITE_NAME, SITE_URL } from "@/config/site";
// Use on-demand revalidation (triggered by Strapi lifecycle hooks)
// Fallback to 1 hour if revalidation API is not called
export const revalidate = 3600; // 1 hour fallback (on-demand is primary)

const FEATURED_CATEGORY_LIMIT = 4;
const LATEST_POSTS_LIMIT = 8;
const CATEGORY_POSTS_LIMIT = 8;

const categoryBannerConfigs: Record<
  string,
  {
    image?: string;
    textColor?: string;
    subtitleColor?: string;
    linkColor?: string;
    linkText?: string;
    title?: string;
    subtitle?: string;
  }
> = {
  cooking: {
    image: "/images/blog/Cooking.webp",
    title: "هنرهای آشپزی",
    textColor: "text-white",
    subtitle: "مجله اینفینیتی پر از فوت و فن آشپزیه!",
    subtitleColor: "text-[#745721]",
    linkColor: "text-white",
    linkText: "مقالات آشپزی",
  },
  beauty: {
    image: "/images/blog/Beauty.webp",
    title: "پوست، مو و زیبایی",
    textColor: "text-[#EB7A4D]",
    subtitle: "هرچیزی که نیازه برای مراقب از خودت بدونی!",
    subtitleColor: "text-[#A3A3A3]",
    linkColor: "text-[#EB7A4D]",
    linkText: "مقالات زیبایی",
  },
  default: {
    image: "/images/blog/Cooking.webp",
    textColor: "dark",
  },
};


function getBannerConfig(slug: string) {
  if (!slug) return categoryBannerConfigs.default;
  // Try exact match first
  if (slug in categoryBannerConfigs && slug !== "default") {
    return categoryBannerConfigs[slug];
  }
  // Try case-insensitive match
  const lowerSlug = slug.toLowerCase();
  const matchingKey = Object.keys(categoryBannerConfigs).find(
    (key) => key.toLowerCase() === lowerSlug && key !== "default"
  );
  if (matchingKey) {
    return categoryBannerConfigs[matchingKey];
  }
  return categoryBannerConfigs.default;
}

function hasBannerConfig(slug: string): boolean {
  if (!slug) return false;
  // Try exact match first
  if (slug in categoryBannerConfigs && slug !== "default") {
    return true;
  }
  // Try case-insensitive match
  const lowerSlug = slug.toLowerCase();
  return Object.keys(categoryBannerConfigs).some(
    (key) => key.toLowerCase() === lowerSlug && key !== "default"
  );
}

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

async function fetchFeaturedCategories(limit: number): Promise<BlogCategory[]> {
  try {
    const response = await blogService.getBlogCategories();
    const categories = response.data || [];

    return categories.filter((category) => Boolean(category?.Slug)).slice(0, limit);
  } catch (error) {
    console.error("Error fetching blog categories:", error);
    return [];
  }
}

async function fetchPostsForCategories(
  categories: BlogCategory[]
): Promise<Record<string, BlogPost[]>> {
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
    })
  );

  return categories.reduce<Record<string, BlogPost[]>>((acc, category, index) => {
    if (category.Slug) {
      acc[category.Slug] = postsByCategory[index] || [];
    }
    return acc;
  }, {});
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const categoryFilter = typeof params.category === "string" ? params.category : undefined;

  const [latestPosts, categories] = await Promise.all([
    fetchLatestPublishedPosts(),
    fetchFeaturedCategories(FEATURED_CATEGORY_LIMIT),
  ]);

  let postsByCategory: Record<string, BlogPost[]> =
    categories.length > 0 ? await fetchPostsForCategories(categories) : {};

  // WORKAROUND: Backend filter not working, so filter on frontend
  // Group posts by their actual category slugs with deduplication
  const actualPostsByCategory: Record<string, BlogPost[]> = {};
  const seenPostIds = new Set<string>();

  Object.entries(postsByCategory).forEach(([_, posts]) => {
    posts.forEach((post) => {
      const categorySlug = post.blog_category?.Slug;
      const postKey = `${categorySlug}-${post.id}`;

      if (categorySlug && !seenPostIds.has(postKey)) {
        seenPostIds.add(postKey);
        if (!actualPostsByCategory[categorySlug]) {
          actualPostsByCategory[categorySlug] = [];
        }
        actualPostsByCategory[categorySlug].push(post);
      }
    });
  });
  postsByCategory = actualPostsByCategory;

  // Split categories: those with banner configs become banners, others become rows
  // Banners show even without posts, rows only show if they have posts
  // Pattern: newest blogs → banner (if config exists) → row → banner (if config exists) → row → default banner
  const bannerCategories = categories.filter((cat) => hasBannerConfig(cat.Slug));
  const rowCategories = categories.filter((cat) => {
    if (hasBannerConfig(cat.Slug)) return false; // Already in banners
    const posts = postsByCategory[cat.Slug] || [];
    return posts.length > 0; // Only show rows with posts
  });

  // If category filter is active, fetch and show only that category's posts
  if (categoryFilter) {
    const filteredCategory = categories.find(cat => cat.Slug === categoryFilter);
    const filteredPosts = postsByCategory[categoryFilter] || [];
    const bannerConfig = getBannerConfig(categoryFilter);
    const categoryTitle = bannerConfig.title || filteredCategory?.Title || "مقالات";

    return (
      <div className="min-h-screen bg-slate-50" dir="rtl">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-pink-50 to-slate-50 py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-4 text-3xl font-bold text-neutral-900 md:text-5xl">{categoryTitle}</h1>
            <p className="mx-auto max-w-2xl text-base text-neutral-600 md:text-lg">
              {bannerConfig.subtitle || `مقالات دسته‌بندی ${categoryTitle}`}
            </p>
          </div>
        </div>

        {/* Filtered Posts Grid */}
        <div className="container mx-auto px-4 py-12 pb-20">
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-neutral-600">هیچ مقاله‌ای در این دسته‌بندی یافت نشد.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-pink-50 to-slate-50 py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-3xl font-bold text-neutral-900 md:text-5xl">اینفینیتی مگ</h1>
          <p className="mx-auto max-w-2xl text-base text-neutral-600 md:text-lg">
            آخرین مقالات، آموزش‌ها و بینش‌های ما را در زمینه رنگ، طراحی و دکوراسیون کشف کنید
          </p>
        </div>
      </div>

      {/* Latest Posts Carousel */}
      {latestPosts.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <BlogCarousel posts={latestPosts} title="جدید ترین ها" viewAllHref="/blog" />
        </div>
      )}

      {/* Alternating Banners and Category Rows */}
      <div className="container mx-auto space-y-12 px-4 pb-16">
        {/* Show banner categories as banners first */}
        {bannerCategories.map((bannerCategory, index) => {
          const bannerConfig = getBannerConfig(bannerCategory.Slug);
          return (
            <React.Fragment key={`banner-${bannerCategory.Slug}-${index}`}>
              {/* Banner */}
              <BlogCategoryBanner
                title={bannerConfig.title || bannerCategory.Title || "مقالات بیشتر"}
                subtitle={bannerConfig.subtitle}
                href={`/blog?category=${bannerCategory.Slug}`}
                backgroundImage={bannerConfig.image}
                textColor={bannerConfig.textColor}
                subtitleColor={bannerConfig.subtitleColor}
                linkColor={bannerConfig.linkColor}
                linkText={bannerConfig.linkText || "مشاهده دسته بندی"}
                height="lg"
              />
            </React.Fragment>
          );
        })}

        {/* Then show row categories as carousels */}
        {rowCategories.map((rowCategory, index) => {
          const posts = postsByCategory[rowCategory.Slug] || [];
          if (posts.length === 0) return null;

          return (
            <React.Fragment key={`row-${rowCategory.Slug}-${index}`}>
              <BlogCarousel
                posts={posts}
                title={rowCategory.Title || "مقالات"}
                viewAllHref={`/blog?category=${rowCategory.Slug}`}
                isCategory
              />
            </React.Fragment>
          );
        })}

        {/* Featured Banner at the end */}
        <BlogCategoryBanner
          title="همه مقالات اینفینیتی مگ"
          subtitle="تمامی مقالات و محتوای آموزشی ما را مشاهده کنید"
          href="/blog"
          backgroundImage="/images/blog/default.png"
          textColor="text-white"
          subtitleColor="text-slate-500"
          linkColor="text-white"
          linkText="مشاهده همه مقالات"
          height="lg"
        />
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
      const endpoint = `${API_BASE_URL}/blog-categories?filters[Slug][$eq]=${encodeURIComponent(categoryFilter)}&fields[0]=Title&fields[1]=Slug`;
      const response = await fetch(endpoint, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (response.ok) {
        const data = await response.json();
        const categoryData = data?.data?.[0];

        if (categoryData) {
          const categoryTitle = categoryData.attributes?.Title || categoryFilter;
          const title = `${categoryTitle} | وبلاگ ${SITE_NAME}`;
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
