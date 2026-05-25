"use client";

import { API_BASE_URL, IMAGE_BASE_URL } from "@/constants/api";
import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import ProductSmallCard from "../Product/SmallCard";
import type { ProductSmallCardProps } from "../Product/SmallCard";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProductStatus } from "@/components/PLP/types";

interface PLPHeroBannerProps {
  category?: string;
  initialTitle?: string;
  initialImageUrl?: string;
  initialProducts?: ProductSmallCardProps[];
}

interface ProductData {
  id: number;
  attributes: {
    Title: string;
    Slug?: string;
    Description: string;
    Status: ProductStatus;
    AverageRating: number | null;
    RatingCount: number | null;
    SeenCount?: number | null;
    Price?: number | string | null;
    DiscountPrice?: number | string | null;
    Discount?: number | string | null;
    IsAvailable?: boolean | null;
    ColorsCount?: number | string | null;
    ColorCodes?: string[] | null;
    CoverImage: {
      url?: string;
      formats?: {
        thumbnail?: { url?: string };
        small?: { url?: string };
      };
      data?: {
        attributes: {
          url: string;
        };
      };
    };
    product_main_category: {
      Title?: string;
      Slug?: string;
      data?: {
        attributes: {
          Title: string;
          Slug: string;
        };
      };
    };
  };
}

interface ProcessedProduct {
  id: number;
  title: string;
  category: string;
  likedCount: number;
  price: number;
  discountedPrice: number;
  discount: number;
  image: string;
  colorsCount: number;
  colorCodes: string[];
  isAvailable: boolean;
  slug?: string;
}

const MAX_HERO_PRODUCTS = 6;

const BASE_PRODUCT_FETCH_URL = `${API_BASE_URL}/products?view=card&filters[Status]=Active&filters[removedAt][$null]=true&filters[product_variations][Price][$gte]=1&filters[product_variations][product_stock][Count][$gt]=0`;

// Helper to ensure image URLs have proper format
const formatImageUrl = (path?: string): string => {
  if (!path) return "";

  // If IMAGE_BASE_URL is empty and path exists, ensure path starts with /
  if (!IMAGE_BASE_URL && path) {
    return path.startsWith("/") ? path : `/${path}`;
  }

  const url = `${IMAGE_BASE_URL}${path}`;
  // If URL doesn't start with http and doesn't start with /, add /
  if (!url.startsWith("http") && !url.startsWith("/")) {
    return `/${url}`;
  }
  return url;
};

const mapProduct = (product: ProductData): ProcessedProduct => {
  const price = Number(product.attributes.Price || 0);
  const discount = Number(product.attributes.Discount || 0);
  const discountedPrice = Number(product.attributes.DiscountPrice || 0);
  const cover = product.attributes.CoverImage;
  const imagePath =
    cover?.formats?.small?.url ||
    cover?.formats?.thumbnail?.url ||
    cover?.url ||
    cover?.data?.attributes?.url;

  return {
    id: product.id,
    slug: product.attributes.Slug,
    title: product.attributes.Title,
    category:
      product.attributes.product_main_category?.Title ||
      product.attributes.product_main_category?.data?.attributes?.Title ||
      "",
    likedCount: product.attributes.SeenCount || 0,
    price,
    discountedPrice,
    discount,
    image: formatImageUrl(imagePath),
    colorsCount: Number(product.attributes.ColorsCount || 0),
    colorCodes: product.attributes.ColorCodes || [],
    isAvailable: product.attributes.IsAvailable === true,
  };
};

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

const fetchProductsFromUrl = async (url: string): Promise<ProcessedProduct[]> => {
  const response = await fetch(url);
  const data = await response.json();
  if (!Array.isArray(data?.data)) {
    return [];
  }

  return data.data.map((product: ProductData) => mapProduct(product)).filter((product: ProcessedProduct) => product.price > 0);
};

function getFeaturedProducts(category?: string): Promise<ProcessedProduct[]> {
  let url = `${BASE_PRODUCT_FETCH_URL}&pagination[pageSize]=6`;
  url += `&filters[$or][0][Title][$containsi]=کیف&filters[$or][1][Title][$containsi]=کفش&filters[$or][2][Title][$containsi]=صندل&filters[$or][3][Title][$containsi]=کتونی`;

  if (category) {
    url += `&filters[product_main_category][Slug][$eq]=${encodeURIComponent(category)}`;
  }

  return fetchProductsFromUrl(url);
}

function getRandomProducts(): Promise<ProcessedProduct[]> {
  const url = `${BASE_PRODUCT_FETCH_URL}&pagination[pageSize]=20`;
  return fetchProductsFromUrl(url).then((products) => shuffle(products).slice(0, MAX_HERO_PRODUCTS));
}

export default function PLPHeroBanner({
  category,
  initialTitle,
  initialImageUrl,
  initialProducts,
}: PLPHeroBannerProps) {
  const [title, setTitle] = useState(initialTitle || "همه محصولات");
  const [imageUrl, setImageUrl] = useState(initialImageUrl || "/images/PLP.webp");
  const [featuredProducts, setFeaturedProducts] = useState<Array<ProcessedProduct | ProductSmallCardProps>>(
    initialProducts || [],
  );

  useEffect(() => {
    if (initialProducts) return;

    const fetchData = async () => {
      try {
        const [categoryData, products] = await Promise.all([
          category
            ? fetch(`${API_BASE_URL}/product-categories?filters[Slug][$eq]=${category}`).then((res) =>
                res.json(),
              )
            : Promise.resolve({ data: [] }),
          getFeaturedProducts(category),
        ]);

        const normalizedProducts = products.length
          ? shuffle(products).slice(0, MAX_HERO_PRODUCTS)
          : await getRandomProducts();
        setFeaturedProducts(normalizedProducts);

        if (category && categoryData.data.length > 0) {
          const categoryAttributes = categoryData.data[0].attributes;
          setTitle(categoryAttributes.Title);

          if (categoryAttributes.CoverImage?.data?.attributes?.url) {
            const formattedUrl = formatImageUrl(categoryAttributes.CoverImage?.data?.attributes?.url);
            if (formattedUrl) {
              setImageUrl(formattedUrl);
            }
          }
        }
      } catch {
        const fallback = await getRandomProducts();
        setFeaturedProducts(fallback);
      }
    };

    fetchData();
  }, [category, initialProducts]);

  const visibleProducts = featuredProducts
    .filter((product) => product.image && product.image !== "")
    .slice(0, 6);

  return (
    <div className="w-full rounded-2xl bg-slate-50 px-4 py-4">
      <div className="flex flex-col gap-4">
        <Link href="/" className="block w-full">
          <div className="relative h-[244px] w-full overflow-hidden rounded-2xl sm:h-[280px]">
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 1280px"
                priority
                loader={imageUrl.startsWith("http") ? imageLoader : undefined}
              />
            )}
          </div>
        </Link>

        {visibleProducts.length > 0 && (
          <div className="hidden min-w-0 grid-cols-2 gap-3 xl:grid xl:grid-cols-3">
            {visibleProducts.map((product) => (
              <ProductSmallCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
