// This page is now SSR (Server Component) by removing "use client"
import NewIcon from "@/components/PDP/Icons/NewIcon";
import OffIcon from "@/components/PDP/Icons/OffIcon";
import OffersListHomePage from "@/components/PDP/OffersListHomePage";
import Link from "next/link";
import Image from "next/image";
import { API_BASE_URL, IMAGE_BASE_URL } from "@/constants/api";
import fetchWithTimeout from "@/utils/fetchWithTimeout";
import { categories } from "@/constants/categories";

interface ProductCardProps {
  id: number;
  images: string[];
  category: string;
  title: string;
  price: number;
  discount?: number;
  discountPrice?: number;
  seenCount: number;
}

async function getDiscountedProducts(): Promise<ProductCardProps[]> {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/product-variations?filters[IsPublished]=true&filters[Price][$gte]=1&populate[0]=general_discounts&populate[1]=product&filters[general_discounts][$null]=false&populate[2]=product.CoverImage&populate[3]=product.product_main_category&filters[product][Status]=Active`,
      { cache: "no-store", timeoutMs: 15000 },
    );
    const data = await response.json();

    const uniqueProducts = data.data
      .filter((item: any) => {
        return (
          item.attributes.product?.data?.attributes?.CoverImage?.data
            ?.attributes?.url &&
          item.attributes.product?.data?.attributes?.product_main_category?.data
            ?.attributes?.Title &&
          item.attributes.general_discounts?.data?.length > 0 &&
          item.attributes.Price &&
          !isNaN(parseInt(item.attributes.Price)) &&
          parseInt(item.attributes.Price) > 0
        );
      })
      .reduce((acc: Record<string, ProductCardProps>, item: any) => {
        const productId = item.attributes.product.data.id;
        if (!acc[productId]) {
          acc[productId] = {
            id: productId,
            images: [
              `${IMAGE_BASE_URL}${item.attributes.product.data.attributes.CoverImage.data.attributes.url}`,
            ],
            category:
              item.attributes.product.data.attributes.product_main_category.data
                .attributes.Title,
            title: item.attributes.product.data.attributes.Title,
            price: parseInt(item.attributes.Price || "0"),
            discount:
              item.attributes.general_discounts.data[0].attributes.Amount,
            discountPrice:
              parseInt(item.attributes.Price || "0") *
              (1 -
                item.attributes.general_discounts.data[0].attributes.Amount /
                  100),
            seenCount: 0,
          };
        }
        return acc;
      }, {});

    return Object.values(uniqueProducts);
  } catch {
    // Fail gracefully on slow/unstable mobile networks
    return [];
  }
}

async function getNewProducts(): Promise<ProductCardProps[]> {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/products?filters[Status]=Active&populate[0]=CoverImage&populate[1]=product_main_category&populate[2]=product_variations&populate[3]=product_variations.general_discounts&sort[0]=createdAt:desc&pagination[limit]=20`,
      { cache: "no-store", timeoutMs: 15000 },
    );
    const data = await response.json();

    return data.data
      .filter((item: any) => {
        return (
          item.attributes.CoverImage?.data?.attributes?.url &&
          item.attributes.product_main_category?.data?.attributes?.Title &&
          item.attributes.product_variations?.data?.length > 0
        );
      })
      .map((item: any) => {
        const publishedVariations =
          item.attributes.product_variations.data.filter(
            (variation: any) =>
              variation.attributes.IsPublished &&
              variation.attributes.Price &&
              !isNaN(parseInt(variation.attributes.Price)) &&
              parseInt(variation.attributes.Price) > 0,
          );

        if (publishedVariations.length === 0) {
          return null;
        }

        const cheapestVariation = publishedVariations.reduce(
          (cheapest: any, current: any) => {
            const cheapestPrice = parseInt(cheapest.attributes.Price);
            const currentPrice = parseInt(current.attributes.Price);
            return currentPrice < cheapestPrice ? current : cheapest;
          },
        );

        const hasDiscount =
          cheapestVariation?.attributes?.general_discounts?.data?.length > 0;
        const discount = hasDiscount
          ? cheapestVariation.attributes.general_discounts.data[0].attributes
              .Amount
          : undefined;
        const price = parseInt(cheapestVariation?.attributes?.Price || "0");

        return {
          id: item.id,
          images: [
            `${IMAGE_BASE_URL}${item.attributes.CoverImage.data.attributes.url}`,
          ],
          category: item.attributes.product_main_category.data.attributes.Title,
          title: item.attributes.Title,
          price,
          ...(hasDiscount && {
            discount,
            discountPrice: price * (1 - discount! / 100),
          }),
          seenCount: 0,
        };
      })
      .filter((item: any) => item !== null);
  } catch {
    return [];
  }
}

async function getFavoriteProducts(): Promise<ProductCardProps[]> {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/products?filters[Status]=Active&populate[0]=CoverImage&populate[1]=product_main_category&populate[2]=product_variations&sort[0]=AverageRating:desc&pagination[limit]=20`,
      { cache: "no-store", timeoutMs: 15000 },
    );
    const data = await response.json();

    return data.data
      .filter((item: any) => {
        return (
          item.attributes.AverageRating !== null &&
          item.attributes.CoverImage?.data?.attributes?.url &&
          item.attributes.product_main_category?.data?.attributes?.Title &&
          item.attributes.product_variations?.data?.length > 0
        );
      })
      .map((item: any) => {
        const firstVariation = item.attributes.product_variations.data[0];
        const hasDiscount =
          firstVariation?.attributes?.general_discounts?.data?.length > 0;
        const discount = hasDiscount
          ? firstVariation.attributes.general_discounts.data[0].attributes
              .Amount
          : undefined;
        const price = parseInt(firstVariation?.attributes?.Price || "0");

        return {
          id: item.id,
          images: [
            `${IMAGE_BASE_URL}${item.attributes.CoverImage.data.attributes.url}`,
          ],
          category: item.attributes.product_main_category.data.attributes.Title,
          title: item.attributes.Title,
          price,
          ...(hasDiscount && {
            discount,
            discountPrice: price * (1 - discount! / 100),
          }),
          seenCount: item.attributes.RatingCount || 0,
        };
      });
  } catch {
    return [];
  }
}


export default async function Home() {
  const [discountedProducts, newProducts, favoriteProducts] = await Promise.all(
    [getDiscountedProducts(), getNewProducts(), getFavoriteProducts()],
  );

  return (
    <div className="mx-auto mt-5 max-w-screen-xl px-4 pb-8 md:mt-8 md:px-8 md:pb-16 lg:px-16">
      {/* Hero section with responsive images */}
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
        <div className="md:w-1/2">
          <Link href={`/plp?category=shirt`}>
            <Image
              src="/images/index-img2-desktop.png"
              alt="Banner"
              width={1200}
              height={600}
              className="h-full w-full rounded-lg object-cover"
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
