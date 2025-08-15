// This page is now SSR (Server Component) by removing "use client"
import NewIcon from "@/components/PDP/Icons/NewIcon";
import OffIcon from "@/components/PDP/Icons/OffIcon";
import OffersListHomePage from "@/components/PDP/OffersListHomePage";
import Link from "next/link";
import { API_BASE_URL, IMAGE_BASE_URL } from "@/constants/api";

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
  const response = await fetch(
    `${API_BASE_URL}/product-variations?filters[IsPublished]=true&filters[Price][$gte]=1&populate[0]=general_discounts&populate[1]=product&filters[general_discounts][$null]=false&populate[2]=product.CoverImage&populate[3]=product.product_main_category&filters[product][Status]=Active`,
    { cache: "no-store" }
  );
  const data = await response.json();

  const uniqueProducts = data.data
    .filter((item: any) => {
      return (
        item.attributes.product?.data?.attributes?.CoverImage?.data?.attributes
          ?.url &&
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
          discount: item.attributes.general_discounts.data[0].attributes.Amount,
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
}

async function getNewProducts(): Promise<ProductCardProps[]> {
  const response = await fetch(
    `${API_BASE_URL}/products?filters[Status]=Active&populate[0]=CoverImage&populate[1]=product_main_category&populate[2]=product_variations&populate[3]=product_variations.general_discounts&sort[0]=createdAt:desc&pagination[limit]=20`,
    { cache: "no-store" }
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
            parseInt(variation.attributes.Price) > 0
        );

      if (publishedVariations.length === 0) {
        return null;
      }

      const cheapestVariation = publishedVariations.reduce(
        (cheapest: any, current: any) => {
          const cheapestPrice = parseInt(cheapest.attributes.Price);
          const currentPrice = parseInt(current.attributes.Price);
          return currentPrice < cheapestPrice ? current : cheapest;
        }
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
}

async function getFavoriteProducts(): Promise<ProductCardProps[]> {
  const response = await fetch(
    `${API_BASE_URL}/products?filters[Status]=Active&populate[0]=CoverImage&populate[1]=product_main_category&populate[2]=product_variations&sort[0]=AverageRating:desc&pagination[limit]=20`,
    { cache: "no-store" }
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
        ? firstVariation.attributes.general_discounts.data[0].attributes.Amount
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
}

const categories = [
  {
    id: 1,
    name: "مانتو",
    image: "/images/categories/coat.png",
    backgroundColor: "#FFF8E7",
    slug: "coat-and-mantle",
  },
  {
    id: 2,
    name: "پلیور",
    image: "/images/categories/blouse.png",
    backgroundColor: "#F0FFED",
    slug: "%d9%be%d9%84%db%8c%d9%88%d8%b1-%d9%88-%d8%a8%d8%a7%d9%81%d8%aa",
  },
  {
    id: 3,
    name: "دامن",
    image: "/images/categories/skirt.png",
    backgroundColor: "#FFF0ED",
    slug: "skirt",
  },
  {
    id: 4,
    name: "پیرهن",
    image: "/images/categories/dress.png",
    backgroundColor: "#EDF6FF",
    slug: "shirt",
  },
  {
    id: 5,
    name: "شلوار",
    image: "/images/categories/pants.png",
    backgroundColor: "#F0FFF7",
    slug: "pants",
  },
  {
    id: 6,
    name: "شال و روسری",
    image: "/images/categories/scarf.png",
    backgroundColor: "#FFF8E7",
    slug: "shawls-and-scarves",
  },
  {
    id: 7,
    name: "هودی",
    image: "/images/categories/hoodie.png",
    backgroundColor: "#FFF8E7",
    slug: "hoodie-and-dores",
  },
];

export default async function Home() {
  const [discountedProducts, newProducts, favoriteProducts] = await Promise.all(
    [getDiscountedProducts(), getNewProducts(), getFavoriteProducts()]
  );

  return (
    <div className="mt-5 md:mt-8 px-4 md:px-8 lg:px-16 max-w-screen-xl mx-auto pb-8 md:pb-16">
      {/* Hero section with responsive images */}
      <div className="hidden md:block">
        <img
          src="/images/index-img1-desktop.png"
          alt="Hero Banner"
          className="w-full rounded-lg object-cover"
        />
      </div>
      <div className="md:hidden">
        <img
          src="/images/index-img1-mobile.png"
          alt="Hero Banner Mobile"
          className="w-full rounded-lg"
        />
      </div>

      {/* Secondary banners section */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-4">
        <div className="md:w-1/2">
        <Link href={`/plp?category=shirt`}>
          <img
            src="/images/index-img2-desktop.png"
            alt="Banner"
            className="w-full h-full rounded-lg object-cover"
          />
          </Link>
        </div>

        <div className="flex gap-2 md:w-1/2 md:flex-col md:gap-4">
          <div className="w-1/2 md:w-full">
          <Link href={`/plp?category=%d9%be%d9%84%db%8c%d9%88%d8%b1-%d9%88-%d8%a8%d8%a7%d9%81%d8%aa`}>
            <img
              src="/images/index-img3-desktop.png"
              alt="Banner"
              className="w-full h-full rounded-lg object-cover"
            /></Link>
          </div>

          <div className="w-1/2 md:w-full">
          <Link href={`/plp?category=skirt`}>
            <img
              src="/images/index-img4-desktop.png"
              alt="Banner"
              className="w-full h-full rounded-lg object-cover"
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
        <div className="flex items-center justify-between mb-4">
          <span className="text-foreground-primary text-2xl md:text-3xl">
            دسته‌بندی‌ها
          </span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
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
                className="rounded-full p-4 flex items-center justify-center w-24 h-24 md:w-28 md:h-28 transition-transform hover:scale-105"
                style={{ backgroundColor: category.backgroundColor }}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-16 md:h-20"
                />
              </div>
              <span className="mt-2 text-sm md:text-base">{category.name}</span>
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
      <div className="mt-8 md:mt-12 mb-8 md:mb-12">
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
