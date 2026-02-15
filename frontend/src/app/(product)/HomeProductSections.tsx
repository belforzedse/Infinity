import NewIcon from "@/components/PDP/Icons/NewIcon";
import OffIcon from "@/components/PDP/Icons/OffIcon";
import OffersListHomePage from "@/components/PDP/OffersListHomePage";
import Reveal from "@/components/Reveal";
import FeaturedCategorySection from "@/components/Home/FeaturedCategorySection";
import {
  getHomepageSections,
  getFeaturedCategoryProductsByRating,
} from "@/services/product/homepage";
import type { ProductSmallCardProps } from "@/components/Product/SmallCard";

/** Streamed block: heavy product sections so shell can send first and reduce server blocking. */
export default async function HomeProductSections({
  featuredCategorySlug,
  featuredCategoryBannerImage,
}: {
  featuredCategorySlug: string;
  featuredCategoryBannerImage: string;
}) {
  const [{ discounted, new: newProducts, favorites }, featuredCategoryProducts] =
    await Promise.all([
      getHomepageSections(),
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

  return (
    <>
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

      <section className="space-y-10">
        <div className="hidden space-y-10 md:block">
          <Reveal variant="fade-up" duration={700}>
            <OffersListHomePage icon={<NewIcon />} title="جدیدترین ها" products={newProducts} />
          </Reveal>
          {favorites.length > 0 && (
            <Reveal variant="fade-up" duration={700}>
              <OffersListHomePage
                icon={<NewIcon />}
                title="محبوب ترین ها"
                products={favorites}
              />
            </Reveal>
          )}
        </div>
        <div className="space-y-10 md:hidden">
          <Reveal variant="blur-up" duration={1500}>
            <OffersListHomePage icon={<NewIcon />} title="جدیدترین ها" products={newProducts} />
          </Reveal>
          {favorites.length > 0 && (
            <Reveal variant="blur-up" duration={1500}>
              <OffersListHomePage
                icon={<NewIcon />}
                title="محبوب ترین ها"
                products={favorites}
              />
            </Reveal>
          )}
        </div>
      </section>

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
    </>
  );
}
