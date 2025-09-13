// This page is now SSR (Server Component) by removing "use client"
import NewIcon from "@/components/PDP/Icons/NewIcon";
import OffIcon from "@/components/PDP/Icons/OffIcon";
import OffersListHomePage from "@/components/PDP/OffersListHomePage";
import Link from "next/link";
import Image from "next/image";
import { categories } from "@/constants/categories";
import {
  getDiscountedProducts,
  getNewProducts,
  getFavoriteProducts,
} from "@/services/product/homepage";

export default async function Home() {
  const [discountedProducts, newProducts, favoriteProducts] = await Promise.all(
    [getDiscountedProducts(), getNewProducts(), getFavoriteProducts()],
  );

  return (
    <div className="mx-auto mt-5 max-w-screen-xl px-4 pb-8 md:mt-8 md:px-8 md:pb-16 lg:max-w-screen-2xl lg:px-16">
      {/* Hero section with responsive images */}
      <div className="lg:hidden">
        <div className="hidden md:block">
          <Image
            src="/images/index-img1-desktop.png"
            alt="Hero Banner"
            width={1920}
            height={560}
            className="w-full rounded-lg object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div className="md:hidden">
          <Image
            src="/images/index-img1-mobile.png"
            alt="Hero Banner Mobile"
            width={750}
            height={520}
            className="w-full rounded-lg"
            priority
            sizes="100vw"
          />
        </div>

        {/* Secondary banners section */}
        <div className="mt-4 flex flex-col gap-2 md:flex-row md:gap-4">
          <div className="rounded-4xl md:w-3/4">
            <Link href={`/plp?category=shirt`}>
              <Image
                src="/images/index-img2-mobile.png"
                alt="Banner"
                width={1200}
                height={600}
                className="h-full w-full rounded-b-[10px] rounded-t-[50px] object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </Link>
          </div>

          <div className="flex gap-2 md:w-1/2 md:flex-col md:gap-4">
            <div className="w-1/2 md:w-full">
              <Link
                href={`/plp?category=%d9%be%d9%84%db%8c%d9%88%d8%b1-%d9%88-%d8%a8%d8%a7%d9%81%d8%aa`}
              >
                <Image
                  src="/images/index-img3-desktop.png"
                  alt="Banner"
                  width={600}
                  height={600}
                  className="h-full w-full rounded-lg object-cover"
                  loading="lazy"
                  sizes="(max-width: 768px) 50vw, 50vw"
                />
              </Link>
            </div>

            <div className="w-1/2 md:w-full">
              <Link href={`/plp?category=skirt`}>
                <Image
                  src="/images/index-img4-desktop.png"
                  alt="Banner"
                  width={600}
                  height={600}
                  className="h-full w-full rounded-lg object-cover"
                  loading="lazy"
                  sizes="(max-width: 768px) 50vw, 50vw"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/*Desktop hero section*/}
      <div className="hidden h-[480] w-full lg:block">
        <div className="grid-cols-1 grid-rows-2">
          <div className="flex gap-10">
            <div className="h-full w-7/12 flex-none">
              <div className="mt-11 grid grid-cols-2 grid-rows-2 gap-4">
                <div className="col-span-2 row-span-1">
                  {/*Wide pinterest banner*/}
                  <Image
                    src="/images/index-img1-desktop.png"
                    alt="Hero Banner"
                    width={1024}
                    height={560}
                    className="rounded-lg object-cover"
                    priority
                  />
                </div>
                {/* the 2 banners below the wide banner */}
                <div className="col-span-1 col-start-1 row-span-1 row-start-2">
                  <Image
                    src="/images/index-img3-desktop.png"
                    alt="Banner"
                    width={600}
                    height={600}
                    className="h-full w-full translate-y-[-2px] rounded-lg object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="row-start2 col-span-1 col-start-2 row-span-1">
                  <Image
                    src="/images/index-img4-desktop.png"
                    alt="Banner"
                    width={600}
                    height={600}
                    loading="lazy"
                    className="translate-y-[7px]"
                  />
                </div>
              </div>
            </div>
            {/* Side banner */}
            <div className="h-full w-4/12 flex-1">
              <Image
                src="/images/index-img2-desktop.png"
                alt="Hero Banner Mobile"
                width={700}
                height={700}
                className="object-fit h-full rounded-lg"
              />
            </div>
          </div>
          <div className="row-start-2 bg-slate-200">
            <p className="mt-4 justify-center text-center text-[60px]">
              PAGINATION
            </p>
          </div>
        </div>
      </div>

      {/* Discounted products section */}
      <div className="mt-8 md:mt-12">
        {discountedProducts.length > 0 && (
          <>
            <OffersListHomePage
              icon={<OffIcon />}
              title="تخفیف‌های وسوسه انگیز"
              products={discountedProducts}
            />
          </>
        )}
      </div>

      {/* Categories section */}
      <div className="mt-8 md:mt-12">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-2xl text-foreground-primary md:text-3xl">
            دسته‌بندی‌ها
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-7">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/plp?category=${category.slug}`}
              className={`flex flex-col items-center ${
                index === categories.length - 1 && categories.length % 3 === 1
                  ? "col-span-3 mx-auto md:col-span-1 md:mx-0"
                  : index >= categories.length - (categories.length % 3) &&
                      categories.length % 3 !== 0 &&
                      categories.length % 3 !== 1
                    ? "mx-auto md:mx-0"
                    : ""
              }`}
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
              <span className="text-sm mt-2 md:text-base">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* New products section */}
      <div className="mt-8 md:mt-12">
        <OffersListHomePage
          icon={<NewIcon />}
          title="جدیدترین ها"
          products={newProducts}
        />
      </div>

      {/* Favorite products section */}
      <div className="mb-8 mt-8 md:mb-12 md:mt-12">
        {favoriteProducts.length > 0 && (
          <>
            <OffersListHomePage
              icon={<NewIcon />}
              title="محبوب ترین ها"
              products={favoriteProducts}
            />
          </>
        )}
      </div>
    </div>
  );
}
