// This page is now SSR (Server Component) by removing "use client"
// Revalidate every 30 seconds to show updated product prices, stock, and discounts
export const revalidate = 30; // 30 seconds

import NewIcon from "@/components/PDP/Icons/NewIcon";
import OffIcon from "@/components/PDP/Icons/OffIcon";
import OffersListHomePage from "@/components/PDP/OffersListHomePage";
import type { Metadata } from "next";
import { getHomepageSections } from "@/services/product/homepage";
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
  ] = await Promise.all([
    getHomepageSections(),
    getLatestBlogPosts(),
    getProductCategories({ parentOnly: true, sort: "Title:asc" }),
  ]);

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
