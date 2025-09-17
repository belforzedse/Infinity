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
import DesktopSlider from "@/components/Hero/desktopSlider";
import MobileSlider from "@/components/Hero/mobileSlider";
import Reveal from "@/components/Reveal";

export default async function Home() {
  const [discountedProducts, newProducts, favoriteProducts] = await Promise.all(
    [getDiscountedProducts(), getNewProducts(), getFavoriteProducts()]
  );

  return (
    <div className="mx-auto mt-5 px-4 pb-8 md:mt-8 md:px-8 md:pb-16 lg:max-w-screen-2xl lg:px-16">
      {/* Hero section with responsive images */}
      <Reveal variant="zoom-in" duration={650}>
        <MobileSlider />
      </Reveal>

      {/* Desktop hero banner */}
      <Reveal delay={100} variant="zoom-in" duration={650}>
        <DesktopSlider />
      </Reveal>

      {/* Discounted products section */}
      <div className="mt-8 md:mt-12">
        {discountedProducts.length > 0 && (
          <Reveal variant="fade-up" duration={700}>
            <OffersListHomePage
              icon={<OffIcon />}
              title="تخفیف‌های وسوسه انگیز"
              products={discountedProducts}
            />
          </Reveal>
        )}
      </div>

      {/* Categories section */}
      <div className="mt-8 md:mt-12">
        <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-6 lg:gap-0">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={category.href}
              className={`flex flex-col items-center ${
                index === categories.length - 1 && categories.length % 3 === 1 ?
                  "col-span-3 mx-auto md:col-span-1 md:mx-0"
                : (
                  index >= categories.length - (categories.length % 3) &&
                  categories.length % 3 !== 0 &&
                  categories.length % 3 !== 1
                ) ?
                  "mx-auto md:mx-0"
                : ""
              }`}
            >
              {/* desktop categories section */}
              <Reveal
                delay={index * 80}
                className="w-full"
                variant="fade-up"
                duration={600}
              >
                <span className="block w-full">
                  <div className="relative hidden h-[340px] w-full overflow-hidden transition-transform duration-300 will-change-transform hover:-translate-y-0.5 lg:block">
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
                    <span className="absolute bottom-2 left-1/2 mt-1 -translate-x-1/2 rounded-lg bg-white px-2.5 py-1.5 text-[18px] font-medium shadow-[0_10px_20px_rgba(0,0,0,0.15)]">
                      {category.name}
                    </span>
                  </div>
                </span>
              </Reveal>
              {/* mobile categories section */}
              <Reveal
                delay={index * 80}
                className="lg:hidden"
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
                <span className="text-sm mx-auto mt-2 block text-center md:text-base">
                  {category.name}
                </span>
              </Reveal>
            </Link>
          ))}
        </div>
      </div>
      <div className="hidden md:block">
        {/* New products section */}
        <div className="mt-8 md:mt-12">
          <Reveal variant="fade-up" duration={700}>
            <OffersListHomePage
              icon={<NewIcon />}
              title="جدیدترین ها"
              products={newProducts}
            />
          </Reveal>
        </div>

        {/* Favorite products section */}
        <div className="mb-8 mt-8 md:mb-12 md:mt-12">
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
      </div>
      <div className="md:hidden">
        {/* New products section */}
        <div className="mt-8 md:mt-12">
          <Reveal variant="blur-up" duration={1500}>
            <OffersListHomePage
              icon={<NewIcon />}
              title="جدیدترین ها"
              products={newProducts}
            />
          </Reveal>
        </div>

        {/* Favorite products section */}
        <div className="mb-8 mt-8 md:mb-12 md:mt-12">
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
      </div>
    </div>
  );
}
