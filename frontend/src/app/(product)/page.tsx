// This page is now SSR (Server Component) by removing "use client"
// Revalidate every 30 seconds to show updated product prices, stock, and discounts
export const revalidate = 30; // 30 seconds

import NewIcon from "@/components/PDP/Icons/NewIcon";
import OffIcon from "@/components/PDP/Icons/OffIcon";
import OffersListHomePage from "@/components/PDP/OffersListHomePage";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { categories } from "@/constants/categories";
import { getHomepageSections } from "@/services/product/homepage";
import { blogService } from "@/services/blog/blog.service";
import { BlogCarousel } from "@/components/Blog";
import DesktopSlider from "@/components/Hero/desktopSlider";
import MobileSlider from "@/components/Hero/mobileSlider";
import TabletSlider from "@/components/Hero/tabletSlider";
import Reveal from "@/components/Reveal";
import PageContainer from "@/components/layout/PageContainer";
import { OrganizationSchema } from "@/components/SEO/OrganizationSchema";

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
    latestBlogPosts
  ] = await Promise.all([
    getHomepageSections(),
    getLatestBlogPosts()
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

      <section className="space-y-6">
        <div className="flex justify-center">
          <div className="grid grid-cols-3 gap-4 md:grid-cols-4 md:gap-6 lg:grid-cols-6 lg:gap-0">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={category.href}
                className="flex flex-col items-center text-center"
              >
              <Reveal
                delay={index * 80}
                className="hidden w-full lg:block"
                variant="fade-up"
                duration={600}
              >
                <div className="relative h-[340px] w-full overflow-hidden border border-slate-100 transition-transform duration-300 hover:-translate-y-0.5">
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ backgroundColor: category.backgroundColor }}
                  >
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={category.width}
                      height={category.height}
                      className="max-h-[240px] w-auto object-contain drop-shadow-md"
                      loading="lazy"
                      sizes="227px 317px"
                    />
                  </div>
                  <span className="text-base absolute bottom-3 left-1/2 -translate-x-1/2 rounded-xl bg-white px-3 py-1.5 font-medium shadow-[0_10px_20px_rgba(0,0,0,0.15)]">
                    {category.name}
                  </span>
                </div>
              </Reveal>

              <Reveal
                delay={index * 80}
                className="flex w-full flex-col items-center lg:hidden"
                variant="fade-up"
                duration={600}
              >
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full p-4 transition-transform hover:scale-105 md:h-28 md:w-28"
                  style={{ backgroundColor: category.backgroundColor }}
                >
                  <Image
                    src={category.image}
                    alt={category.name}
                    width={80}
                    height={80}
                    className="h-16 w-auto md:h-20"
                    loading="lazy"
                    sizes="80px"
                  />
                </div>
                <span className="mt-2 text-center text-sm font-medium md:text-base">{category.name}</span>
              </Reveal>
              </Link>
            ))}
          </div>
        </div>
      </section>

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

export const metadata: Metadata = {
  title: "صفحه اصلی | اینفینیتی استور",
  description:
    "جدیدترین محصولات، تخفیف‌ها و پیشنهادهای ویژه اینفینیتی استور را مشاهده کنید و آنلاین خرید کنید.",
  keywords: ["پوشاک", "فروشگاه آنلاین", "مد", "لباس", "اینفینیتی"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "صفحه اصلی | اینفینیتی استور",
    description:
      "جدیدترین محصولات، تخفیف‌ها و پیشنهادهای ویژه اینفینیتی استور را مشاهده کنید و آنلاین خرید کنید.",
    type: "website",
    url: "/",
    siteName: "اینفینیتی استور",
    locale: "fa_IR",
    images: [
      {
        url: "https://api.infinitycolor.org/uploads/logo_5a5e2f8a4d.png",
        width: 1200,
        height: 630,
        alt: "اینفینیتی استور - فروشگاه پوشاک",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "صفحه اصلی | اینفینیتی استور",
    description:
      "جدیدترین محصولات، تخفیف‌ها و پیشنهادهای ویژه اینفینیتی استور را مشاهده کنید و آنلاین خرید کنید.",
  },
};
