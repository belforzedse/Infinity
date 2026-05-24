// This page is now SSR (Server Component) by removing "use client"
// Revalidate every 60s to balance freshness with server load (fewer revalidations = less Strapi/Next CPU)
export const revalidate = 60;

import type { Metadata } from "next";
import { connection } from "next/server";
import { ALLOWED_HOME_NAV_CATEGORY_NAME_SUBSTRINGS } from "@/constants/categories";
import { getProductCategories } from "@/services/product/categories";
import { blogService } from "@/services/blog/blog.service";
import { getActiveStories } from "@/services/story/story.service";
import { BlogCarousel } from "@/components/Blog";
import StoriesRail from "@/components/Home/StoriesRail";
import DesktopSlider from "@/components/Hero/desktopSlider";
import MobileSlider from "@/components/Hero/mobileSlider";
import TabletSlider from "@/components/Hero/tabletSlider";
import { defaultSliderConfig } from "@/components/Hero/config";
import { mapCmsHeroSliderToLayouts } from "@/components/Hero/config/fromCms";
import { Suspense } from "react";
import Reveal from "@/components/Reveal";
import PageContainer from "@/components/layout/PageContainer";
import { OrganizationSchema } from "@/components/SEO/OrganizationSchema";
import { SITE_NAME, SITE_URL } from "@/config/site";
import HomePromoBanners from "@/components/Home/PromoBanners";
import { getPublicSuperAdminSettings } from "@/services/super-admin/settings/public";
import HomeProductSections from "./HomeProductSections";

export const metadata: Metadata = {
  title: {
    absolute: SITE_NAME,
  },
  description:
    "جدیدترین مانتو، شومیز، شال و روسری، پلیور و اکسسوری را با ارسال سریع از فروشگاه اینفینیتی خرید کنید.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: `${SITE_NAME} | خرید آنلاین پوشاک زنانه`,
    description:
      "خرید آنلاین مانتو، شومیز، شال و روسری، پلیور و اکسسوری از فروشگاه پوشاک اینفینیتی با ارسال سریع.",
    url: SITE_URL,
    type: "website",
  },
};

async function getLatestBlogPosts() {
  try {
    const response = await blogService.getBlogPosts({
      pageSize: 8,
      status: "Published",
      sort: "PublishedAt:desc"
    });
    return response.data || [];
  } catch (error) {
    console.error("Error fetching latest blog posts:", error);
    return [];
  }
}

async function getStoriesForHome() {
  try {
    return await getActiveStories();
  } catch (error) {
    console.error("Error fetching active stories:", error);
    return [];
  }
}

function ProductSectionsFallback() {
  return (
    <section className="space-y-8">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="aspect-[250/270] w-full animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    </section>
  );
}

function StoriesRailFallback() {
  return (
    <section>
      <div className="flex gap-4 overflow-hidden">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="flex shrink-0 flex-col items-center gap-2">
            <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200" />
            <div className="h-3 w-14 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </section>
  );
}

function BlogSectionFallback() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="aspect-[304/260] animate-pulse rounded-2xl bg-gray-200" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-10 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </section>
  );
}

async function StoriesSection() {
  const activeStories = await getStoriesForHome();

  if (activeStories.length === 0) return null;

  return (
    <section>
      <StoriesRail stories={activeStories} />
    </section>
  );
}

async function ProductSectionsBlock({
  featuredCategorySlug,
  featuredCategoryBannerImage,
}: {
  featuredCategorySlug: string;
  featuredCategoryBannerImage: string;
}) {
  const parentCategories = await getProductCategories({
    mainOnly: true,
    sort: "Title:asc",
    featuredOnly: true,
    allowedNameSubstrings: ALLOWED_HOME_NAV_CATEGORY_NAME_SUBSTRINGS,
    revalidate: 90,
  });

  return (
    <HomeProductSections
      featuredCategorySlug={featuredCategorySlug}
      featuredCategoryBannerImage={featuredCategoryBannerImage}
      mainCategories={parentCategories}
    />
  );
}

async function BlogSection() {
  const latestBlogPosts = await getLatestBlogPosts();

  if (latestBlogPosts.length === 0) return null;

  return (
    <section>
      <Reveal variant="fade-up" duration={700}>
        <BlogCarousel
          posts={latestBlogPosts}
          title="اینفینیتی مگ"
          viewAllHref="/blog"
        />
      </Reveal>
    </section>
  );
}

export default async function Home() {
  // Ensure env (e.g. STRAPI_INTERNAL_URL) is read at request time in the container, not build time (Next.js 16)
  await connection();

  const homepageSettings = await getPublicSuperAdminSettings();

  const promoBanners = [
    {
      id: "home-banner-one",
      imageUrl: homepageSettings.homeBannerOneImage,
      title: homepageSettings.homeBannerOneTitle,
      titleColor: homepageSettings.homeBannerOneTitleColor,
      buttonText: homepageSettings.homeBannerOneButtonText,
      buttonColor: homepageSettings.homeBannerOneButtonColor,
      buttonHref: homepageSettings.homeBannerOneButtonHref,
    },
    {
      id: "home-banner-two",
      imageUrl: homepageSettings.homeBannerTwoImage,
      title: homepageSettings.homeBannerTwoTitle,
      titleColor: homepageSettings.homeBannerTwoTitleColor,
      buttonText: homepageSettings.homeBannerTwoButtonText,
      buttonColor: homepageSettings.homeBannerTwoButtonColor,
      buttonHref: homepageSettings.homeBannerTwoButtonHref,
    },
  ];

  const hasPromoBanners = promoBanners.some(
    (banner) => banner.imageUrl?.trim() && banner.title?.trim(),
  );
  const featuredCategorySlug = homepageSettings.homeFeaturedCategorySlug?.trim() || "";
  const featuredCategoryBannerImage =
    homepageSettings.homeFeaturedCategoryBannerImage?.trim() || "";
  const heroFromCms = mapCmsHeroSliderToLayouts(homepageSettings.homeHeroSliderPublished);
  const hasHeroSlides =
    heroFromCms.desktopSlides.length > 0 ||
    heroFromCms.tabletSlides.length > 0 ||
    heroFromCms.mobileSlides.length > 0;
  // Default true: use hardcoded slides unless explicitly disabled via env
  const forceFallback = process.env.NEXT_PUBLIC_FORCE_HERO_FALLBACK !== "false";
  const effectiveHero =
    forceFallback || !hasHeroSlides
      ? {
          desktopSlides: defaultSliderConfig.desktop,
          tabletSlides: defaultSliderConfig.tablet,
          mobileSlides: defaultSliderConfig.mobile,
          autoplayIntervalMs: defaultSliderConfig.autoplayInterval ?? 600000,
          autoplayEligibility: [] as boolean[],
        }
      : heroFromCms;

  return (
    <PageContainer variant="wide" className="space-y-12 pb-16 pt-8">
      {/* JSON-LD Organization Schema for SEO */}
      <OrganizationSchema />

      <section className="space-y-6">
        <Reveal variant="zoom-in" duration={650}>
          <MobileSlider
            slides={effectiveHero.mobileSlides}
            autoplayInterval={effectiveHero.autoplayIntervalMs}
            autoplayEligibility={effectiveHero.autoplayEligibility}
          />
        </Reveal>
        <Reveal delay={50} variant="zoom-in" duration={650}>
          <TabletSlider
            slides={effectiveHero.tabletSlides}
            autoplayInterval={effectiveHero.autoplayIntervalMs}
            autoplayEligibility={effectiveHero.autoplayEligibility}
          />
        </Reveal>
        <Reveal delay={100} variant="zoom-in" duration={650}>
          <DesktopSlider
            slides={effectiveHero.desktopSlides}
            autoplayInterval={effectiveHero.autoplayIntervalMs}
            autoplayEligibility={effectiveHero.autoplayEligibility}
          />
        </Reveal>
      </section>

      <Suspense fallback={<StoriesRailFallback />}>
        <StoriesSection />
      </Suspense>

      <Suspense fallback={<ProductSectionsFallback />}>
        <ProductSectionsBlock
          featuredCategorySlug={featuredCategorySlug}
          featuredCategoryBannerImage={featuredCategoryBannerImage}
        />
      </Suspense>

      {hasPromoBanners && (
        <section>
          <Reveal variant="fade-up" duration={700}>
            <HomePromoBanners banners={promoBanners} />
          </Reveal>
        </section>
      )}

      <Suspense fallback={<BlogSectionFallback />}>
        <BlogSection />
      </Suspense>
    </PageContainer>
  );
}
