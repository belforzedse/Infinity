import React from "react";
import { Metadata } from "next";
import { BlogCarousel, BlogCategoryBanner } from "@/components/Blog";
import { BlogPost, BlogCategory } from "@/services/blog/blog.service";
import { generateBlogListingMetadata } from "@/utils/seo";

export const metadata: Metadata = generateBlogListingMetadata();

// Placeholder data for development
const placeholderPosts: BlogPost[] = [
  {
    id: 1,
    Title: "لورم ایپسوم به او گفت که چرا تو سلام نمیگویی",
    Slug: "lorem-ipsum-post-1",
    Content: "طبق تعریف سازمان ملل متحد، این روز به منظور بزرگداشت حقوق و فرصت‌های برابر برای دختران است. اولین روز جهانی...",
    Excerpt: "طبق تعریف سازمان ملل متحد، این روز به منظور بزرگداشت حقوق و فرصت‌های برابر برای دختران است. اولین روز جهانی...",
    FeaturedImage: {
      id: 1,
      url: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=500&h=300&fit=crop",
      alternativeText: "Blog post image",
      formats: {
        medium: { url: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=500&h=300&fit=crop" },
        small: { url: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=300&h=200&fit=crop" },
        thumbnail: { url: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=150&h=100&fit=crop" }
      }
    },
    Status: "Published",
    PublishedAt: "2024/09/17",
    ViewCount: 1250,
    blog_category: {
      id: 1,
      Name: "اینفینیتی",
      Slug: "infinity",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    blog_author: {
      id: 1,
      Name: "نویسنده اینفینیتی",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    createdAt: "2024-09-17T00:00:00.000Z",
    updatedAt: "2024-09-17T00:00:00.000Z"
  },
  {
    id: 2,
    Title: "راهنمای کامل انتخاب رنگ مناسب برای خانه",
    Slug: "color-guide-home",
    Content: "انتخاب رنگ مناسب برای خانه یکی از مهم‌ترین تصمیمات در دکوراسیون است...",
    Excerpt: "انتخاب رنگ مناسب برای خانه یکی از مهم‌ترین تصمیمات در دکوراسیون است...",
    FeaturedImage: {
      id: 2,
      url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=300&fit=crop",
      alternativeText: "Color palette",
      formats: {
        medium: { url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=300&fit=crop" },
        small: { url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop" },
        thumbnail: { url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&h=100&fit=crop" }
      }
    },
    Status: "Published",
    PublishedAt: "2024/09/16",
    ViewCount: 890,
    blog_category: {
      id: 2,
      Name: "مد و پوشاک",
      Slug: "mod-o-poshak",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    blog_author: {
      id: 1,
      Name: "نویسنده اینفینیتی",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    createdAt: "2024-09-16T00:00:00.000Z",
    updatedAt: "2024-09-16T00:00:00.000Z"
  },
  {
    id: 3,
    Title: "نکات مهم برای سلامت پوست در فصل زمستان",
    Slug: "winter-skin-care",
    Content: "در فصل زمستان، پوست نیاز به مراقبت‌های ویژه‌ای دارد...",
    Excerpt: "در فصل زمستان، پوست نیاز به مراقبت‌های ویژه‌ای دارد...",
    FeaturedImage: {
      id: 3,
      url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&h=300&fit=crop",
      alternativeText: "Skincare products",
      formats: {
        medium: { url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&h=300&fit=crop" },
        small: { url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=200&fit=crop" },
        thumbnail: { url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=150&h=100&fit=crop" }
      }
    },
    Status: "Published",
    PublishedAt: "2024/09/15",
    ViewCount: 654,
    blog_category: {
      id: 3,
      Name: "پزشکی و سلامتی",
      Slug: "pezeshki-va-salamati",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    blog_author: {
      id: 1,
      Name: "نویسنده اینفینیتی",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    createdAt: "2024-09-15T00:00:00.000Z",
    updatedAt: "2024-09-15T00:00:00.000Z"
  },
  {
    id: 4,
    Title: "ورزش‌های مناسب برای تقویت سیستم ایمنی بدن",
    Slug: "exercise-immune-system",
    Content: "ورزش منظم یکی از بهترین راه‌های تقویت سیستم ایمنی بدن است...",
    Excerpt: "ورزش منظم یکی از بهترین راه‌های تقویت سیستم ایمنی بدن است...",
    FeaturedImage: {
      id: 4,
      url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop",
      alternativeText: "Exercise and fitness",
      formats: {
        medium: { url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop" },
        small: { url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop" },
        thumbnail: { url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=100&fit=crop" }
      }
    },
    Status: "Published",
    PublishedAt: "2024/09/14",
    ViewCount: 432,
    blog_category: {
      id: 4,
      Name: "تناسب اندام و تغذیه",
      Slug: "tanasob-andam-va-taghzieh",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    blog_author: {
      id: 1,
      Name: "نویسنده اینفینیتی",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    createdAt: "2024-09-14T00:00:00.000Z",
    updatedAt: "2024-09-14T00:00:00.000Z"
  },
  {
    id: 5,
    Title: "آرایش طبیعی برای روزهای کاری",
    Slug: "natural-makeup-work",
    Content: "آرایش طبیعی و ملایم برای محیط کار بسیار مناسب است...",
    Excerpt: "آرایش طبیعی و ملایم برای محیط کار بسیار مناسب است...",
    FeaturedImage: {
      id: 5,
      url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&h=300&fit=crop",
      alternativeText: "Natural makeup",
      formats: {
        medium: { url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&h=300&fit=crop" },
        small: { url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=200&fit=crop" },
        thumbnail: { url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=150&h=100&fit=crop" }
      }
    },
    Status: "Published",
    PublishedAt: "2024/09/13",
    ViewCount: 789,
    blog_category: {
      id: 5,
      Name: "زیبایی و آرایش",
      Slug: "zibayi-va-arayesh",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    blog_author: {
      id: 1,
      Name: "نویسنده اینفینیتی",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    createdAt: "2024-09-13T00:00:00.000Z",
    updatedAt: "2024-09-13T00:00:00.000Z"
  },
  {
    id: 6,
    Title: "تغذیه سالم برای پوست درخشان",
    Slug: "healthy-diet-glowing-skin",
    Content: "تغذیه مناسب تأثیر مستقیمی بر سلامت و زیبایی پوست دارد...",
    Excerpt: "تغذیه مناسب تأثیر مستقیمی بر سلامت و زیبایی پوست دارد...",
    FeaturedImage: {
      id: 6,
      url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&h=300&fit=crop",
      alternativeText: "Healthy food",
      formats: {
        medium: { url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&h=300&fit=crop" },
        small: { url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=300&h=200&fit=crop" },
        thumbnail: { url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=150&h=100&fit=crop" }
      }
    },
    Status: "Published",
    PublishedAt: "2024/09/12",
    ViewCount: 567,
    blog_category: {
      id: 4,
      Name: "تناسب اندام و تغذیه",
      Slug: "tanasob-andam-va-taghzieh",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    blog_author: {
      id: 1,
      Name: "نویسنده اینفینیتی",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    createdAt: "2024-09-12T00:00:00.000Z",
    updatedAt: "2024-09-12T00:00:00.000Z"
  },
  {
    id: 7,
    Title: "ترکیب رنگ‌ها در لباس‌پوشی",
    Slug: "color-combination-fashion",
    Content: "ترکیب صحیح رنگ‌ها در لباس می‌تواند ظاهر شما را متحول کند...",
    Excerpt: "ترکیب صحیح رنگ‌ها در لباس می‌تواند ظاهر شما را متحول کند...",
    FeaturedImage: {
      id: 7,
      url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&h=300&fit=crop",
      alternativeText: "Fashion colors",
      formats: {
        medium: { url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&h=300&fit=crop" },
        small: { url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&h=200&fit=crop" },
        thumbnail: { url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=150&h=100&fit=crop" }
      }
    },
    Status: "Published",
    PublishedAt: "2024/09/11",
    ViewCount: 923,
    blog_category: {
      id: 2,
      Name: "مد و پوشاک",
      Slug: "mod-o-poshak",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    blog_author: {
      id: 1,
      Name: "نویسنده اینفینیتی",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    createdAt: "2024-09-11T00:00:00.000Z",
    updatedAt: "2024-09-11T00:00:00.000Z"
  },
  {
    id: 8,
    Title: "مراقبت از مو در فصل پاییز",
    Slug: "autumn-hair-care",
    Content: "در فصل پاییز، موها نیاز به مراقبت‌های خاصی دارند...",
    Excerpt: "در فصل پاییز، موها نیاز به مراقبت‌های خاصی دارند...",
    FeaturedImage: {
      id: 8,
      url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&h=300&fit=crop",
      alternativeText: "Hair care",
      formats: {
        medium: { url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&h=300&fit=crop" },
        small: { url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=200&fit=crop" },
        thumbnail: { url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&h=100&fit=crop" }
      }
    },
    Status: "Published",
    PublishedAt: "2024/09/10",
    ViewCount: 445,
    blog_category: {
      id: 5,
      Name: "زیبایی و آرایش",
      Slug: "zibayi-va-arayesh",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    blog_author: {
      id: 1,
      Name: "نویسنده اینفینیتی",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    createdAt: "2024-09-10T00:00:00.000Z",
    updatedAt: "2024-09-10T00:00:00.000Z"
  }
];

const placeholderCategories: BlogCategory[] = [
  {
    id: 1,
    Name: "مد و پوشاک",
    Slug: "mod-o-poshak",
    Description: "آخرین ترندها و نکات استایل",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: 2,
    Name: "پزشکی و سلامتی",
    Slug: "pezeshki-va-salamati",
    Description: "مقالات تخصصی سلامت و بهداشت",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: 3,
    Name: "تناسب اندام و تغذیه",
    Slug: "tanasob-andam-va-taghzieh",
    Description: "راهنمای تناسب اندام و تغذیه سالم",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: 4,
    Name: "زیبایی و آرایش",
    Slug: "zibayi-va-arayesh",
    Description: "نکات زیبایی و آرایش حرفه‌ای",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
];

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

// Filter posts by category
function getPostsByCategory(categorySlug: string): BlogPost[] {
  return placeholderPosts.filter(post => post.blog_category?.Slug === categorySlug);
}

export default async function BlogPage() {
  // Use placeholder data instead of API calls
  const latestPosts = placeholderPosts.slice(0, 8);
  const categories = placeholderCategories;

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
      <div className="container mx-auto px-4 py-8">
        <BlogCarousel
          posts={latestPosts}
          title="اینفینیتی مگ"
          viewAllHref="/blog"
        />
      </div>

      {/* Category Sections with Banners */}
      <div className="container mx-auto px-4 space-y-12 pb-16">
        {categories.map((category, index) => {
          const bannerConfig = getBannerConfig(category.Slug);
          const categoryPosts = getPostsByCategory(category.Slug);

          return (
            <React.Fragment key={category.id}>
              {/* Category Carousel */}
              {categoryPosts.length > 0 && (
                <BlogCarousel
                  posts={categoryPosts}
                  title={category.Name}
                  viewAllHref={`/blog?category=${category.Slug}`}
                  isCategory
                />
              )}

              {/* Banner after every 2 categories (index 1 and 3) */}
              {(index === 1) && index < categories.length - 1 && (
                <BlogCategoryBanner
                  title={categories[index + 1]?.Name || "مقالات بیشتر"}
                  subtitle={getBannerConfig(categories[index + 1]?.Slug || "default").subtitle}
                  href={`/blog?category=${categories[index + 1]?.Slug || ""}`}
                  backgroundColor={getBannerConfig(categories[index + 1]?.Slug || "default").backgroundColor}
                  textColor={getBannerConfig(categories[index + 1]?.Slug || "default").textColor}
                  linkText="مشاهده دسته بندی"
                  height="sm"
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Featured Banner at the end */}
        <BlogCategoryBanner
          title="همه مقالات اینفینیتی مگ"
          subtitle="تمامی مقالات و محتوای آموزشی ما را مشاهده کنید"
          href="/blog"
          backgroundColor="bg-gradient-to-br from-neutral-800 to-neutral-900"
          textColor="light"
          linkText="مشاهده همه مقالات"
          height="md"
        />
      </div>
    </div>
  );
}
