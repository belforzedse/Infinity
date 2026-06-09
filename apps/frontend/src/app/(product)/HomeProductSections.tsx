import { Suspense } from "react";
import { SkeletonBlock, SkeletonMedia, SkeletonText } from "@repo/ui/skeleton";
import NewIcon from "@/components/PDP/Icons/NewIcon";
import OffIcon from "@/components/PDP/Icons/OffIcon";
import OffersListHomePage from "@/components/PDP/OffersListHomePage";
import OffersListHomePageServerShell from "@/components/PDP/OffersListHomePageServerShell";
import Reveal from "@/components/Reveal";
import HomePromoBanners, { type HomePromoBanner } from "@/components/Home/PromoBanners";
import HomeGifPromoSection from "@/components/Home/HomeGifPromoSection";
import {
  getBatchedHomepageSections,
  getHomepageSections,
  getGifPromoProducts,
  getHomeSectionProducts,
  getProductsByIds,
  pickBatchedHomepageSection,
  type HomepageProductSectionId,
} from "@/services/product/homepage";
import type { SuperAdminSettings } from "@/types/super-admin/settings";
import type { ProductCardProps } from "@/components/Product/Card";

const NEWEST_BACKGROUND_ELLIPSES = [
  "right-[-8%] top-[-18%] h-[230px] w-[390px] bg-[#E2EBFE] motion-safe:animate-[newest-ellipse-float-a_6.5s_ease-in-out_infinite] md:h-[300px] md:w-[520px]",
  "right-[22%] top-[8%] h-[180px] w-[320px] bg-[#E2EBFE] motion-safe:animate-[newest-ellipse-float-b_7.25s_ease-in-out_infinite] md:h-[240px] md:w-[430px]",
  "left-[18%] bottom-[-24%] h-[220px] w-[410px] bg-[#E2EBFE] motion-safe:animate-[newest-ellipse-float-c_6.75s_ease-in-out_infinite] md:h-[290px] md:w-[560px]",
  "right-[6%] bottom-[-16%] h-[210px] w-[360px] bg-[#FFFEED] motion-safe:animate-[newest-ellipse-float-b_7.75s_ease-in-out_infinite] md:h-[280px] md:w-[500px]",
  "left-[36%] top-[-20%] h-[190px] w-[340px] bg-[#FFFEED] motion-safe:animate-[newest-ellipse-float-c_6.25s_ease-in-out_infinite] md:h-[260px] md:w-[460px]",
  "left-[-10%] top-[18%] h-[240px] w-[420px] bg-[#FFFEED] motion-safe:animate-[newest-ellipse-float-a_8.25s_ease-in-out_infinite] md:h-[320px] md:w-[570px]",
  "left-[-4%] bottom-[8%] h-[190px] w-[340px] bg-[#FFF3E3] motion-safe:animate-[newest-ellipse-float-c_7.5s_ease-in-out_infinite] md:h-[270px] md:w-[470px]",
  "left-[46%] bottom-[-20%] h-[200px] w-[380px] bg-[#FFF3E3] motion-safe:animate-[newest-ellipse-float-a_6.85s_ease-in-out_infinite] md:h-[280px] md:w-[520px]",
  "right-[44%] top-[30%] h-[170px] w-[310px] bg-[#FFF3E3] motion-safe:animate-[newest-ellipse-float-b_7s_ease-in-out_infinite] md:h-[230px] md:w-[440px]",
] as const;

type HomepageSectionsPromise = ReturnType<typeof getHomepageSections>;
type HomepageSectionsLoader = () => HomepageSectionsPromise;
type BatchedHomepageSectionsPromise = ReturnType<typeof getBatchedHomepageSections>;

function shouldUseProductServerShell(sectionId: HomepageProductSectionId): boolean {
  return process.env.HOME_PRODUCT_SERVER_SHELL_SECTION?.trim() === sectionId;
}

function HomeOffersList({
  sectionId,
  icon,
  title,
  products,
  hideBottomViewMore,
}: {
  sectionId: HomepageProductSectionId;
  icon: React.ReactNode;
  title: string;
  products: ProductCardProps[];
  hideBottomViewMore?: boolean;
}) {
  const Component = shouldUseProductServerShell(sectionId)
    ? OffersListHomePageServerShell
    : OffersListHomePage;

  return (
    <Component
      hideBottomViewMore={hideBottomViewMore}
      icon={icon}
      title={title}
      products={products}
    />
  );
}

function ProductCardsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(count)].map((_, index) => (
        <div key={index} className="space-y-3">
          <SkeletonMedia aspect="250 / 270" className="rounded-lg" />
          <SkeletonText tone="light" className="h-4 w-4/5" />
          <SkeletonBlock tone="light" className="h-6 w-2/3 rounded" />
        </div>
      ))}
    </div>
  );
}

function ProductRailSectionSkeleton() {
  return (
    <section className="space-y-10">
      <SkeletonText className="h-8 w-48" />
      <ProductCardsSkeleton />
    </section>
  );
}

function NewestSectionSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-160px] z-0 overflow-hidden blur-[74.5px]"
      >
        {NEWEST_BACKGROUND_ELLIPSES.map((ellipseClass, index) => (
          <span
            key={index}
            className={`absolute rounded-full opacity-[0.45] ${ellipseClass}`}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-[360px] w-full max-w-[1360px] items-center px-2 py-8 sm:px-5 md:min-h-[430px] md:py-10 lg:min-h-[510px] lg:px-[60px] lg:py-0">
        <div className="w-full min-w-0 space-y-10">
          <SkeletonText className="h-8 w-48" />
          <ProductCardsSkeleton />
        </div>
      </div>
    </section>
  );
}

function GifPromoSectionSkeleton() {
  return (
    <section aria-hidden="true" className="w-full min-w-0 overflow-hidden">
      <div className="grid min-w-0 grid-cols-1 gap-2 xl:grid-cols-2">
        {[...Array(2)].map((_, index) => (
          <div
            key={index}
            className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(190px,42vw)_minmax(0,1fr)] lg:grid-cols-[329.5px_1fr]"
          >
            <SkeletonBlock className="min-h-[360px] w-full rounded-[24px] sm:min-h-[480px] lg:h-[564px] lg:min-h-0" />
            <div className="grid min-w-0 grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-1 lg:h-full lg:content-between lg:gap-0">
              {[...Array(4)].map((_, productIndex) => (
                <SkeletonBlock
                  key={productIndex}
                  tone="light"
                  className="h-32 rounded-2xl lg:h-[132px]"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

async function NewestSection({
  getSections,
  batchedSectionsPromise,
}: {
  getSections: HomepageSectionsLoader;
  batchedSectionsPromise: BatchedHomepageSectionsPromise;
}) {
  const batchedSections = await batchedSectionsPromise;
  const batchedProducts = pickBatchedHomepageSection(batchedSections, "newest");
  const newProducts = batchedProducts ?? (await getSections()).new;

  return (
    <section
      data-home-section="newest-products"
      className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-160px] z-0 overflow-hidden blur-[74.5px]"
      >
        {NEWEST_BACKGROUND_ELLIPSES.map((ellipseClass, index) => (
          <span
            key={index}
            className={`absolute rounded-full opacity-[0.85] will-change-transform ${ellipseClass}`}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-[360px] w-full max-w-[1360px] items-center px-2 py-8 sm:px-5 md:min-h-[430px] md:py-10 lg:min-h-[510px] lg:px-[60px] lg:py-0">
        <div className="w-full min-w-0">
          <div className="hidden space-y-10 md:block">
            <Reveal variant="fade-up" duration={700}>
              <HomeOffersList
                sectionId="newest"
                hideBottomViewMore
                icon={<NewIcon />}
                title="جدیدترین ها"
                products={newProducts}
              />
            </Reveal>
          </div>
          <div className="space-y-10 md:hidden">
            <Reveal variant="blur-up" duration={1500}>
              <HomeOffersList
                sectionId="newest"
                hideBottomViewMore
                icon={<NewIcon />}
                title="جدیدترین ها"
                products={newProducts}
              />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

async function FavoritesSection({
  getSections,
  batchedSectionsPromise,
}: {
  getSections: HomepageSectionsLoader;
  batchedSectionsPromise: BatchedHomepageSectionsPromise;
}) {
  const batchedSections = await batchedSectionsPromise;
  const favorites =
    pickBatchedHomepageSection(batchedSections, "favorites") ?? (await getSections()).favorites;
  if (favorites.length === 0) return null;

  return (
    <section className="space-y-10">
      <div className="hidden md:block">
        <Reveal variant="fade-up" duration={700}>
          <HomeOffersList
            sectionId="favorites"
            icon={<NewIcon />}
            title="محبوب ترین ها"
            products={favorites}
          />
        </Reveal>
      </div>
      <div className="md:hidden">
        <Reveal variant="blur-up" duration={1500}>
          <HomeOffersList
            sectionId="favorites"
            icon={<NewIcon />}
            title="محبوب ترین ها"
            products={favorites}
          />
        </Reveal>
      </div>
    </section>
  );
}

async function DiscountedSection({
  getSections,
  batchedSectionsPromise,
}: {
  getSections: HomepageSectionsLoader;
  batchedSectionsPromise: BatchedHomepageSectionsPromise;
}) {
  const batchedSections = await batchedSectionsPromise;
  const discounted =
    pickBatchedHomepageSection(batchedSections, "discounted") ?? (await getSections()).discounted;
  if (discounted.length === 0) return null;

  return (
    <section>
      <Reveal variant="fade-up" duration={700}>
        <HomeOffersList
          sectionId="discounted"
          icon={<OffIcon />}
          title="تخفیف‌های وسوسه انگیز"
          products={discounted}
        />
      </Reveal>
    </section>
  );
}

async function GifPromoSection({
  homepageSettings,
  batchedSectionsPromise,
}: {
  homepageSettings: SuperAdminSettings;
  batchedSectionsPromise: BatchedHomepageSectionsPromise;
}) {
  const batchedSections = await batchedSectionsPromise;
  const batchedSlot1 = pickBatchedHomepageSection(batchedSections, "gifPromoSlot1");
  const batchedSlot2 = pickBatchedHomepageSection(batchedSections, "gifPromoSlot2");
  const fallbackProducts =
    batchedSlot1 === null || batchedSlot2 === null
      ? await getGifPromoProducts(homepageSettings)
      : { slot1: [], slot2: [] };
  const gifPromoProducts = {
    slot1: batchedSlot1 ?? fallbackProducts.slot1,
    slot2: batchedSlot2 ?? fallbackProducts.slot2,
  };

  return (
    <Reveal variant="fade-up" duration={700}>
      <HomeGifPromoSection
        slots={[
          {
            id: "slot-1",
            imageUrl: homepageSettings.homeGifPromoSlot1Image,
            products: gifPromoProducts.slot1,
          },
          {
            id: "slot-2",
            imageUrl: homepageSettings.homeGifPromoSlot2Image,
            products: gifPromoProducts.slot2,
          },
        ]}
      />
    </Reveal>
  );
}

async function CustomSection({
  homepageSettings,
  batchedSectionsPromise,
}: {
  homepageSettings: SuperAdminSettings;
  batchedSectionsPromise: BatchedHomepageSectionsPromise;
}) {
  const batchedSections = await batchedSectionsPromise;
  const customSectionProducts =
    pickBatchedHomepageSection(batchedSections, "custom") ??
    (await getHomeSectionProducts(homepageSettings.homeCustomSectionAssignment));
  if (customSectionProducts.length === 0) return null;

  return (
    <section>
      <Reveal variant="fade-up" duration={700}>
        <HomeOffersList
          sectionId="custom"
          icon={<NewIcon />}
          title={homepageSettings.homeCustomSectionTitle || "بخش ویژه"}
          products={customSectionProducts}
        />
      </Reveal>
    </section>
  );
}

async function WeeklyPicksSection({
  productIds,
  batchedSectionsPromise,
}: {
  productIds: number[];
  batchedSectionsPromise: BatchedHomepageSectionsPromise;
}) {
  const batchedSections = await batchedSectionsPromise;
  const weeklyPicksProducts =
    pickBatchedHomepageSection(batchedSections, "weeklyPicks") ?? (await getProductsByIds(productIds));
  if (weeklyPicksProducts.length === 0) return null;

  return (
    <section>
      <Reveal variant="fade-up" duration={700}>
        <HomeOffersList
          sectionId="weeklyPicks"
          icon={<NewIcon />}
          title="منتخب‌های این هفته"
          products={weeklyPicksProducts}
        />
      </Reveal>
    </section>
  );
}

async function EveryoneFollowsSection({
  productIds,
  batchedSectionsPromise,
}: {
  productIds: number[];
  batchedSectionsPromise: BatchedHomepageSectionsPromise;
}) {
  const batchedSections = await batchedSectionsPromise;
  const everyoneFollowsProducts =
    pickBatchedHomepageSection(batchedSections, "everyoneFollows") ??
    (await getProductsByIds(productIds));
  if (everyoneFollowsProducts.length === 0) return null;

  return (
    <section>
      <Reveal variant="fade-up" duration={700}>
        <HomeOffersList
          sectionId="everyoneFollows"
          icon={<NewIcon />}
          title="همه دنبالشَن"
          products={everyoneFollowsProducts}
        />
      </Reveal>
    </section>
  );
}

/** Streamed block: product sections keep DOM order but no longer wait on one aggregate Promise.all. */
export default function HomeProductSections({
  homepageSettings,
  promoBanners,
}: {
  homepageSettings?: SuperAdminSettings;
  promoBanners?: HomePromoBanner[];
}) {
  let homepageSectionsPromise: HomepageSectionsPromise | null = null;
  const getHomepageSectionsFallback = () => {
    homepageSectionsPromise ??= getHomepageSections(homepageSettings);
    return homepageSectionsPromise;
  };
  const batchedSectionsPromise = getBatchedHomepageSections();
  const hasPromoBanners = promoBanners?.some((banner) => Boolean(banner.imageUrl?.trim()));

  return (
    <>
      <Suspense fallback={<NewestSectionSkeleton />}>
        <NewestSection
          getSections={getHomepageSectionsFallback}
          batchedSectionsPromise={batchedSectionsPromise}
        />
      </Suspense>

      <Suspense fallback={<ProductRailSectionSkeleton />}>
        <FavoritesSection
          getSections={getHomepageSectionsFallback}
          batchedSectionsPromise={batchedSectionsPromise}
        />
      </Suspense>

      <Suspense fallback={<ProductRailSectionSkeleton />}>
        <DiscountedSection
          getSections={getHomepageSectionsFallback}
          batchedSectionsPromise={batchedSectionsPromise}
        />
      </Suspense>

      {homepageSettings?.homeGifPromoEnabled && (
        <Suspense fallback={<GifPromoSectionSkeleton />}>
          <GifPromoSection
            homepageSettings={homepageSettings}
            batchedSectionsPromise={batchedSectionsPromise}
          />
        </Suspense>
      )}

      {homepageSettings?.homeCustomSectionEnabled && (
        <Suspense fallback={<ProductRailSectionSkeleton />}>
          <CustomSection
            homepageSettings={homepageSettings}
            batchedSectionsPromise={batchedSectionsPromise}
          />
        </Suspense>
      )}

      {hasPromoBanners && (
        <section>
          <Reveal variant="fade-up" duration={700}>
            <HomePromoBanners banners={promoBanners ?? []} />
          </Reveal>
        </section>
      )}

      {homepageSettings?.homeWeeklyPicksEnabled &&
        homepageSettings.homeWeeklyPicksProductIds.length > 0 && (
          <Suspense fallback={<ProductRailSectionSkeleton />}>
            <WeeklyPicksSection
              productIds={homepageSettings.homeWeeklyPicksProductIds}
              batchedSectionsPromise={batchedSectionsPromise}
            />
          </Suspense>
        )}

      {homepageSettings?.homeEveryoneFollowsEnabled &&
        homepageSettings.homeEveryoneFollowsProductIds.length > 0 && (
          <Suspense fallback={<ProductRailSectionSkeleton />}>
            <EveryoneFollowsSection
              productIds={homepageSettings.homeEveryoneFollowsProductIds}
              batchedSectionsPromise={batchedSectionsPromise}
            />
          </Suspense>
        )}
    </>
  );
}
