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
import HeroBannerSlider from "@/components/Hero/HeroBannerSlider";
import { mapCmsHeroSliderToBannerSlides } from "@/components/Hero/config/fromCms";
import { Suspense } from "react";
import Reveal from "@/components/Reveal";
import PageContainer from "@/components/layout/PageContainer";
import { OrganizationSchema } from "@/components/SEO/OrganizationSchema";
import { SITE_NAME, SITE_URL } from "@/config/site";
import type { HomePromoBanner } from "@/components/Home/PromoBanners";
import {
  getPublicSuperAdminSettings,
  getPublicHeroSlider,
} from "@/services/super-admin/settings/public";
import HomeProductSections from "./HomeProductSections";
import CategoryCarousel from "@/components/Categories/CategoryCarousel";
import SiteGifBanner from "@/components/Home/SiteGifBanner";
import InfinitygramSection, {
  InfinitygramSectionSkeleton,
} from "@/components/Home/InfinitygramSection";
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
      sort: "PublishedAt:desc",
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

function CategoryCarouselFallback() {
  return (
    <section>
      <div className="scrollbar-hide grid auto-cols-[124px] grid-flow-col gap-2 overflow-hidden pb-4 lg:auto-cols-[calc((100%_-_60px)_/_6)] lg:gap-3">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <SkeletonBlock className="h-[116px] w-[116px] rounded-full lg:aspect-[227/310] lg:h-auto lg:w-full lg:rounded-3xl" />
            <SkeletonText tone="light" className="h-4 w-16" />
          </div>
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
  homepageSettings,
  promoBanners,
}: {
  homepageSettings: SuperAdminSettings;
  promoBanners: HomePromoBanner[];
}) {
  return (
    <HomeProductSections
      homepageSettings={homepageSettings}
      promoBanners={promoBanners}
    />
  );
}

async function CategorySection() {
  const parentCategories = await getProductCategories({
    mainOnly: true,
    sort: "Title:asc",
    featuredOnly: true,
    allowedNameSubstrings: ALLOWED_HOME_NAV_CATEGORY_NAME_SUBSTRINGS,
    revalidate: 90,
  });

  if (parentCategories.length === 0) return null;

  return (
    <section>
      <CategoryCarousel categories={parentCategories} />
    </section>
  );
}

async function BlogSection() {
  const latestBlogPosts = await getLatestBlogPosts();

  if (latestBlogPosts.length === 0) return null;

  return (
    <section>
      <Reveal variant="fade-up" duration={700}>
        <BlogCarousel posts={latestBlogPosts} title="اینفینیتی مگ" viewAllHref="/blog" />
      </Reveal>
    </section>
  );
}

export default async function Home() {
  const [homepageSettings, heroSlider] = await Promise.all([
    getPublicSuperAdminSettings(),
    getPublicHeroSlider(),
  ]);

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
  const heroFromCms = mapCmsHeroSliderToBannerSlides(heroSlider.published);

  return (
    <>
      <PageContainer variant="wide" className="space-y-4 pb-4 pt-8">
        {/* JSON-LD Organization Schema for SEO */}
        <OrganizationSchema />

        <Suspense fallback={<StoriesRailFallback />}>
          <StoriesSection />
        </Suspense>

        <SiteGifBanner
          enabled={homepageSettings.siteGifEnabled}
          imageUrl={homepageSettings.siteGifImage}
          linkHref={homepageSettings.siteGifLinkHref}
          altText={homepageSettings.siteGifAltText}
        />

        <section className="space-y-0">
          <Reveal variant="zoom-in" duration={650}>
            <HeroBannerSlider
              slides={heroFromCms.slides}
              autoplayInterval={heroFromCms.autoplayIntervalMs}
              autoplayEligibility={heroFromCms.autoplayEligibility}
            />
          </Reveal>
        </section>

        <Suspense fallback={<CategoryCarouselFallback />}>
          <CategorySection />
        </Suspense>

        <Suspense fallback={<ProductSectionsFallback />}>
          <ProductSectionsBlock
            homepageSettings={homepageSettings}
            promoBanners={promoBanners}
          />
        </Suspense>
      </PageContainer>

      <Suspense fallback={<InfinitygramSectionSkeleton />}>
        <InfinitygramSection />
      </Suspense>

      <PageContainer variant="wide" className="pb-16 pt-4">
        <Suspense fallback={<BlogSectionFallback />}>
          <BlogSection />
        </Suspense>
      </PageContainer>
    </>
  );
}
