// This page is now SSR (Server Component) by removing "use client"
// Revalidate every 30 seconds to show updated product prices, stock, and discounts
export const revalidate = 30; // 30 seconds

import NewIcon from "@/components/PDP/Icons/NewIcon";
import OffIcon from "@/components/PDP/Icons/OffIcon";
import OffersListHomePage from "@/components/PDP/OffersListHomePage";
import type { Metadata } from "next";
import {
  getFeaturedCategoryProductsByRating,
  getHomepageSections,
} from "@/services/product/homepage";
import { getProductCategories } from "@/services/product/categories";
import { blogService } from "@/services/blog/blog.service";
import { BlogCarousel } from "@/components/Blog";
import DesktopSlider from "@/components/Hero/desktopSlider";
import MobileSlider from "@/components/Hero/mobileSlider";
import TabletSlider from "@/components/Hero/tabletSlider";
import Reveal from "@/components/Reveal";
import PageContainer from "@/components/layout/PageContainer";
import { OrganizationSchema } from "@/components/SEO/OrganizationSchema";
import { SITE_NAME, SITE_URL } from "@/config/site";
import CategoryCarousel from "@/components/Categories/CategoryCarousel";
import HomePromoBanners from "@/components/Home/PromoBanners";
import FeaturedCategorySection from "@/components/Home/FeaturedCategorySection";
import { getPublicSuperAdminSettings } from "@/services/super-admin/settings/public";
import type { ProductSmallCardProps } from "@/components/Product/SmallCard";

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

export default async function Home() {
  const [
    { discounted: discountedProducts, new: newProducts, favorites: favoriteProducts },
    latestBlogPosts,
    parentCategories,
    homepageSettings,
  ] = await Promise.all([
    getHomepageSections(),
    getLatestBlogPosts(),
    getProductCategories({ parentOnly: true, sort: "Title:asc" }),
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
  const featuredCategoryProducts = featuredCategorySlug && featuredCategoryBannerImage
    ? await getFeaturedCategoryProductsByRating(featuredCategorySlug, 6)
    : [];

  const featuredCategorySmallProducts: ProductSmallCardProps[] = featuredCategoryProducts
    .filter((product) => Boolean(product.images?.[0]))
    .slice(0, 6)
    .map((product) => ({
      id: product.id,
      slug: product.slug,
      title: product.title,
      category: product.category,
      likedCount: product.seenCount || 0,
      price: product.price,
      discountedPrice: product.discountPrice,
      discount: product.discount,
      image: product.images[0] || "",
      isAvailable: product.isAvailable,
      colorsCount: product.colorsCount,
      colorCodes: product.colorCodes,
    }));

  const hasFeaturedCategorySection =
    Boolean(featuredCategorySlug) &&
    Boolean(featuredCategoryBannerImage) &&
    featuredCategorySmallProducts.length > 0;

  return (
    <PageContainer variant="wide" className="space-y-12 pb-16 pt-8">
      {/* JSON-LD Organization Schema for SEO */}
      <OrganizationSchema />

      <section className="space-y-6">
        <Reveal variant="zoom-in" duration={650}>
          <MobileSlider />
        </Reveal>
        <Reveal delay={50} variant="zoom-in" duration={650}>
          <TabletSlider />
        </Reveal>
        <Reveal delay={100} variant="zoom-in" duration={650}>
          <DesktopSlider />
        </Reveal>
      </section>

      {discountedProducts.length > 0 && (
        <section>
          <Reveal variant="fade-up" duration={700}>
            <OffersListHomePage
              icon={<OffIcon />}
              title="تخفیف‌های وسوسه انگیز"
              products={discountedProducts}
            />
          </Reveal>
        </section>
      )}

      {parentCategories.length > 0 && (
        <section className="space-y-6">
          <CategoryCarousel categories={parentCategories} />
        </section>
      )}

      <section className="space-y-10">
        <div className="hidden space-y-10 md:block">
          <Reveal variant="fade-up" duration={700}>
            <OffersListHomePage icon={<NewIcon />} title="جدیدترین ها" products={newProducts} />
          </Reveal>

          {favoriteProducts.length > 0 && (
            <Reveal variant="fade-up" duration={700}>
              <OffersListHomePage
                icon={<NewIcon />}
                title="محبوب ترین ها"
                products={favoriteProducts}
              />
            </Reveal>
          )}
        </div>

        <div className="space-y-10 md:hidden">
          <Reveal variant="blur-up" duration={1500}>
            <OffersListHomePage icon={<NewIcon />} title="جدیدترین ها" products={newProducts} />
          </Reveal>

          {favoriteProducts.length > 0 && (
            <Reveal variant="blur-up" duration={1500}>
              <OffersListHomePage
                icon={<NewIcon />}
                title="محبوب ترین ها"
                products={favoriteProducts}
              />
            </Reveal>
          )}
        </div>
      </section>

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

      {hasFeaturedCategorySection && (
        <section>
          <Reveal variant="fade-up" duration={700}>
            <FeaturedCategorySection
              bannerImageUrl={featuredCategoryBannerImage}
              categorySlug={featuredCategorySlug}
              products={featuredCategorySmallProducts}
            />
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
