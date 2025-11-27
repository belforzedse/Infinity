import React from "react";
import { Metadata } from "next";
import { BlogCarousel, BlogCategoryBanner } from "@/components/Blog";
import { blogService, BlogCategory } from "@/services/blog/blog.service";
import { generateBlogListingMetadata } from "@/utils/seo";

export const metadata: Metadata = generateBlogListingMetadata();

async function getLatestPosts() {
  try {
    const response = await blogService.getBlogPosts({ 
      pageSize: 8, 
      status: "Published",
      sort: "PublishedAt:desc" 
    });
    return response.data || [];
  } catch (error) {
    console.error("Error fetching latest posts:", error);
    return [];
  }
}

async function getCategories(): Promise<BlogCategory[]> {
  try {
    const response = await blogService.getBlogCategories();
    // Extract categories from Strapi response format
    if (response.data && Array.isArray(response.data)) {
      return response.data.map((item: any) => ({
        id: item.id,
        ...(item.attributes || item),
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Banner configurations for different categories
const categoryBannerConfigs: Record<string, {
  backgroundColor: string;
  textColor: "light" | "dark";
  subtitle?: string;
}> = {
  "mod-o-poshak": {
    backgroundColor: "bg-gradient-to-br from-rose-400 to-pink-600",
    textColor: "light",
    subtitle: "آخرین ترندها و نکات استایل",
  },
  "pezeshki-va-salamati": {
    backgroundColor: "bg-gradient-to-br from-emerald-400 to-teal-600",
    textColor: "light",
    subtitle: "مقالات تخصصی سلامت و بهداشت",
  },
  "tanasob-andam-va-taghzieh": {
    backgroundColor: "bg-gradient-to-br from-amber-400 to-orange-500",
    textColor: "light",
    subtitle: "راهنمای تناسب اندام و تغذیه سالم",
  },
  "zibayi-va-arayesh": {
    backgroundColor: "bg-gradient-to-br from-fuchsia-400 to-purple-600",
    textColor: "light",
    subtitle: "نکات زیبایی و آرایش حرفه‌ای",
  },
  "default": {
    backgroundColor: "bg-gradient-to-br from-pink-100 to-pink-200",
    textColor: "dark",
  },
};

function getBannerConfig(slug: string) {
  return categoryBannerConfigs[slug] || categoryBannerConfigs["default"];
}

export default async function BlogPage() {
  const [latestPosts, categories] = await Promise.all([
    getLatestPosts(),
    getCategories(),
  ]);

  // Take up to 4 categories to display
  const displayCategories = categories.slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-pink-50 to-slate-50 py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-3xl font-bold text-neutral-900 md:text-5xl">
            اینفینیتی مگ
          </h1>
          <p className="mx-auto max-w-2xl text-base md:text-lg text-neutral-600">
            آخرین مقالات، آموزش‌ها و بینش‌های ما را در زمینه رنگ، طراحی و دکوراسیون کشف کنید
          </p>
        </div>
      </div>

      {/* Latest Posts Carousel */}
      {latestPosts.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <BlogCarousel
            posts={latestPosts}
            title="جدیدترین مقالات"
            viewAllHref="/blog"
          />
        </div>
      )}

      {/* Category Sections with Banners */}
      <div className="container mx-auto px-4 space-y-12 pb-16">
        {displayCategories.map((category, index) => {
          const bannerConfig = getBannerConfig(category.Slug);
          
          return (
            <React.Fragment key={category.id}>
              {/* Category Carousel */}
              <BlogCarousel
                category={category.Slug}
                title={category.Name}
                viewAllHref={`/blog?category=${category.Slug}`}
                isCategory
              />

              {/* Banner after every 2 categories (index 1 and 3) */}
              {(index === 1 || index === 3) && index < displayCategories.length - 1 && (
                <BlogCategoryBanner
                  title={displayCategories[index + 1]?.Name || "مقالات بیشتر"}
                  subtitle={getBannerConfig(displayCategories[index + 1]?.Slug || "default").subtitle}
                  href={`/blog?category=${displayCategories[index + 1]?.Slug || ""}`}
                  backgroundColor={getBannerConfig(displayCategories[index + 1]?.Slug || "default").backgroundColor}
                  textColor={getBannerConfig(displayCategories[index + 1]?.Slug || "default").textColor}
                  linkText="مشاهده دسته بندی"
                  height="sm"
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Featured Banner at the end */}
        {categories.length > 0 && (
          <BlogCategoryBanner
            title="همه مقالات اینفینیتی مگ"
            subtitle="تمامی مقالات و محتوای آموزشی ما را مشاهده کنید"
            href="/blog"
            backgroundColor="bg-gradient-to-br from-neutral-800 to-neutral-900"
            textColor="light"
            linkText="مشاهده همه مقالات"
            height="md"
          />
        )}
      </div>
    </div>
  );
}