// This page is now SSR (Server Component) by removing "use client"
// Revalidate every 60s to balance freshness with server load (fewer revalidations = less Strapi/Next CPU)
export const revalidate = 60;

import type { Metadata } from "next";
import { ALLOWED_HOME_NAV_CATEGORY_NAME_SUBSTRINGS } from "@/constants/categories";
import { getProductCategories } from "@/services/product/categories";
import { blogService } from "@/services/blog/blog.service";
import { BlogCarousel } from "@/components/Blog";
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
  title: `${SITE_NAME} | خرید آنلاین پوشاک زنانه`,
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

function ProductSectionsFallback() {
  return (
    <section className="space-y-8">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {[...Array(8)].map((i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    </section>
  );
}

export default async function Home() {
  const [latestBlogPosts, parentCategories, homepageSettings] = await Promise.all([
    getLatestBlogPosts(),
    getProductCategories({
        mainOnly: true,
        sort: "Title:asc",
        allowedNameSubstrings: ALLOWED_HOME_NAV_CATEGORY_NAME_SUBSTRINGS,
      }),
    getPublicSuperAdminSettings(),
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
  const effectiveHero = hasHeroSlides
    ? heroFromCms
    : {
        desktopSlides: defaultSliderConfig.desktop,
        tabletSlides: defaultSliderConfig.tablet,
        mobileSlides: defaultSliderConfig.mobile,
        autoplayIntervalMs: defaultSliderConfig.autoplayInterval ?? 600000,
        autoplayEligibility: [] as boolean[],
      };

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

      <Suspense fallback={<ProductSectionsFallback />}>
        <HomeProductSections
          featuredCategorySlug={featuredCategorySlug}
          featuredCategoryBannerImage={featuredCategoryBannerImage}
          mainCategories={parentCategories}
        />
      </Suspense>

      {hasPromoBanners && (
        <section>
          <Reveal variant="fade-up" duration={700}>
            <div className="-mx-4 sm:-mx-6 lg:-mx-8">
              <div className="px-2 sm:px-4 lg:px-6">
                <HomePromoBanners banners={promoBanners} />
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* Blog Section */}
      {latestBlogPosts.length > 0 && (
        <section>
          <Reveal variant="fade-up" duration={700}>
            <BlogCarousel
              posts={latestBlogPosts}
              title="اینفینیتی مگ"
              viewAllHref="/blog"
            />
          </Reveal>
        </section>
      )}
    </PageContainer>
  );
}
