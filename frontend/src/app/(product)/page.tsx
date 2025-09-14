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

export default async function Home() {
  const [discountedProducts, newProducts, favoriteProducts] = await Promise.all(
    [getDiscountedProducts(), getNewProducts(), getFavoriteProducts()],
  );

  return (
    <div className="mx-auto mt-5 max-w-screen-xl px-4 pb-8 md:mt-8 md:px-8 md:pb-16 lg:max-w-screen-2xl lg:px-16">
      {/* Hero section with responsive images */}
      <MobileSlider />

      {/* Desktop hero banner */}
      <DesktopSlider />

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
