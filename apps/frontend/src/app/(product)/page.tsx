// This page is now SSR (Server Component) by removing "use client"
// Revalidate every 60s to balance freshness with server load (fewer revalidations = less Strapi/Next CPU)
export const revalidate = 60;

import type { Metadata } from "next";
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
import type { HomePromoBanner } from "@/components/Home/PromoBanners";
import { getPublicSuperAdminSettings } from "@/services/super-admin/settings/public";
import HomeProductSections from "./HomeProductSections";
import { SkeletonBlock, SkeletonMedia, SkeletonText } from "@repo/ui/skeleton";
import type { SuperAdminSettings } from "@/types/super-admin/settings";

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
      <SkeletonText className="h-8 w-48" />
      <div className="grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, index) => (
          <SkeletonMedia key={index} aspect="250 / 270" className="rounded-lg" />
        ))}
      </div>
    </section>
  );
}

function StoriesRailFallback() {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <SkeletonText tone="light" className="h-8 w-40 md:h-9" />
        <SkeletonText tone="light" className="h-5 w-36" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="flex shrink-0 flex-col items-center gap-2">
            <SkeletonBlock className="h-16 w-16 rounded-full" />
            <SkeletonText tone="light" className="h-3 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BlogSectionFallback() {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <SkeletonText className="h-8 w-40 md:h-9" />
        <SkeletonText tone="light" className="h-5 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="space-y-3">
            <SkeletonMedia aspect="304 / 260" />
            <SkeletonText tone="light" className="h-4 w-3/4" />
            <SkeletonBlock tone="light" className="h-10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function StoriesSection() {
  const activeStories = await getStoriesForHome();

  if (activeStories.length === 0) return null;

  return <StoriesRail stories={activeStories} />;
}

async function ProductSectionsBlock({
  featuredCategorySlug,
  featuredCategoryBannerImage,
  homepageSettings,
  promoBanners,
}: {
  featuredCategorySlug: string;
  featuredCategoryBannerImage: string;
  homepageSettings: SuperAdminSettings;
  promoBanners: HomePromoBanner[];
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
      homepageSettings={homepageSettings}
      promoBanners={promoBanners}
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
      subtitle: homepageSettings.homeBannerOneSubtitle,
      subtitleColor: homepageSettings.homeBannerOneSubtitleColor,
      backgroundColor: homepageSettings.homeBannerOneBackgroundColor,
      textSize: homepageSettings.homeBannerOneTextSize,
      fontWeight: homepageSettings.homeBannerOneFontWeight,
      textAlign: homepageSettings.homeBannerOneTextAlign,
      contentPosition: homepageSettings.homeBannerOneContentPosition,
      imageFit: homepageSettings.homeBannerOneImageFit,
      imagePosition: homepageSettings.homeBannerOneImagePosition,
      desktopHeight: homepageSettings.homeBannerOneDesktopHeight,
      mobileHeight: homepageSettings.homeBannerOneMobileHeight,
    },
    {
      id: "home-banner-two",
      imageUrl: homepageSettings.homeBannerTwoImage,
      title: homepageSettings.homeBannerTwoTitle,
      titleColor: homepageSettings.homeBannerTwoTitleColor,
      buttonText: homepageSettings.homeBannerTwoButtonText,
      buttonColor: homepageSettings.homeBannerTwoButtonColor,
      buttonHref: homepageSettings.homeBannerTwoButtonHref,
      subtitle: homepageSettings.homeBannerTwoSubtitle,
      subtitleColor: homepageSettings.homeBannerTwoSubtitleColor,
      backgroundColor: homepageSettings.homeBannerTwoBackgroundColor,
      textSize: homepageSettings.homeBannerTwoTextSize,
      fontWeight: homepageSettings.homeBannerTwoFontWeight,
      textAlign: homepageSettings.homeBannerTwoTextAlign,
      contentPosition: homepageSettings.homeBannerTwoContentPosition,
      imageFit: homepageSettings.homeBannerTwoImageFit,
      imagePosition: homepageSettings.homeBannerTwoImagePosition,
      desktopHeight: homepageSettings.homeBannerTwoDesktopHeight,
      mobileHeight: homepageSettings.homeBannerTwoMobileHeight,
    },
  ];
  const featuredCategorySlug = homepageSettings.homeFeaturedCategorySlug?.trim() || "";
  const featuredCategoryBannerImage =
    homepageSettings.homeFeaturedCategoryBannerImage?.trim() || "";
  const heroFromCms = mapCmsHeroSliderToLayouts(homepageSettings.homeHeroSliderPublished);
  const hasHeroSlides =
    heroFromCms.desktopSlides.length > 0 ||
    heroFromCms.tabletSlides.length > 0 ||
    heroFromCms.mobileSlides.length > 0;
  const effectiveHero = hasHeroSlides
    ? heroFromCms
    : {
        desktopSlides: [],
        tabletSlides: [],
        mobileSlides: [],
        autoplayIntervalMs: defaultSliderConfig.autoplayInterval ?? 600000,
        autoplayEligibility: [] as boolean[],
      };

  return (
    <PageContainer variant="wide" className="space-y-4 pb-16 pt-8">
      {/* JSON-LD Organization Schema for SEO */}
      <OrganizationSchema />

      <section className="space-y-0">
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
          homepageSettings={homepageSettings}
          promoBanners={promoBanners}
        />
      </Suspense>

      <Suspense fallback={<BlogSectionFallback />}>
        <BlogSection />
      </Suspense>
    </PageContainer>
  );
}
