import NewIcon from "@/components/PDP/Icons/NewIcon";
import OffIcon from "@/components/PDP/Icons/OffIcon";
import OffersListHomePage from "@/components/PDP/OffersListHomePage";
import Reveal from "@/components/Reveal";
import FeaturedCategorySection from "@/components/Home/FeaturedCategorySection";
import HomePromoBanners, { type HomePromoBanner } from "@/components/Home/PromoBanners";
import CategoryCarousel from "@/components/Categories/CategoryCarousel";
import {
  getHomepageSections,
  getFeaturedCategoryProductsByRating,
} from "@/services/product/homepage";
import type { ProductSmallCardProps } from "@/components/Product/SmallCard";
import type { ProductCategorySummary } from "@/services/product/categories";
import type { SuperAdminSettings } from "@/types/super-admin/settings";

/** Streamed block: heavy product sections so shell can send first and reduce server blocking. */
export default async function HomeProductSections({
  featuredCategorySlug,
  featuredCategoryBannerImage,
  mainCategories,
  homepageSettings,
  promoBanners,
}: {
  featuredCategorySlug: string;
  featuredCategoryBannerImage: string;
  mainCategories: ProductCategorySummary[];
  homepageSettings?: SuperAdminSettings;
  promoBanners?: HomePromoBanner[];
}) {
  const [{ discounted, new: newProducts, favorites }, featuredCategoryProducts] =
    await Promise.all([
      getHomepageSections(homepageSettings),
      featuredCategorySlug && featuredCategoryBannerImage
        ? getFeaturedCategoryProductsByRating(featuredCategorySlug, 6)
        : Promise.resolve([]),
    ]);

  const featuredCategorySmallProducts: ProductSmallCardProps[] = featuredCategoryProducts
    .filter((p) => Boolean(p.images?.[0]))
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
  const hasPromoBanners = promoBanners?.some(
    (banner) => banner.imageUrl?.trim() && banner.title?.trim(),
  );

  return (
    <>
      {/* 1. جدیدترین ها (Newest) */}
      <section className="space-y-10">
        <div className="hidden space-y-10 md:block">
          <Reveal variant="fade-up" duration={700}>
            <OffersListHomePage icon={<NewIcon />} title="جدیدترین ها" products={newProducts} />
          </Reveal>
        </div>
        <div className="space-y-10 md:hidden">
          <Reveal variant="blur-up" duration={1500}>
            <OffersListHomePage icon={<NewIcon />} title="جدیدترین ها" products={newProducts} />
          </Reveal>
        </div>
      </section>

      {/* 2. Category carousel */}
      {mainCategories.length > 0 && (
        <section className="space-y-6">
          <CategoryCarousel categories={mainCategories} />
        </section>
      )}

      {/* 3. محبوب ترین ها (Most popular) */}
      {favorites.length > 0 && (
        <section className="space-y-10">
          <div className="hidden md:block">
            <Reveal variant="fade-up" duration={700}>
              <OffersListHomePage
                icon={<NewIcon />}
                title="محبوب ترین ها"
                products={favorites}
              />
            </Reveal>
          </div>
          <div className="md:hidden">
            <Reveal variant="blur-up" duration={1500}>
              <OffersListHomePage
                icon={<NewIcon />}
                title="محبوب ترین ها"
                products={favorites}
              />
            </Reveal>
          </div>
        </section>
      )}

      {discounted.length > 0 && (
        <section>
          <Reveal variant="fade-up" duration={700}>
            <OffersListHomePage
              icon={<OffIcon />}
              title="تخفیف‌های وسوسه انگیز"
              products={discounted}
            />
          </Reveal>
        </section>
      )}

      {hasPromoBanners && (
        <section>
          <Reveal variant="fade-up" duration={700}>
            <HomePromoBanners banners={promoBanners ?? []} />
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
              title={homepageSettings?.homeFeaturedCategoryTitle}
              subtitle={homepageSettings?.homeFeaturedCategorySubtitle}
              ctaText={homepageSettings?.homeFeaturedCategoryCtaText}
              ctaHref={homepageSettings?.homeFeaturedCategoryCtaHref}
              textColor={homepageSettings?.homeFeaturedCategoryTextColor}
              textSize={homepageSettings?.homeFeaturedCategoryTextSize}
              fontWeight={homepageSettings?.homeFeaturedCategoryFontWeight}
              bannerBackgroundColor={homepageSettings?.homeFeaturedCategoryBannerBackgroundColor}
              bannerImageFit={homepageSettings?.homeFeaturedCategoryBannerImageFit}
              bannerImagePosition={homepageSettings?.homeFeaturedCategoryBannerImagePosition}
              desktopBannerHeight={homepageSettings?.homeFeaturedCategoryDesktopBannerHeight}
              mobileBannerHeight={homepageSettings?.homeFeaturedCategoryMobileBannerHeight}
            />
          </Reveal>
        </section>
      )}
    </>
  );
}
