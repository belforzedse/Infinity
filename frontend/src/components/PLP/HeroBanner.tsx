"use client";

import { API_BASE_URL, IMAGE_BASE_URL } from "@/constants/api";
import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import ProductSmallCard from "../Product/SmallCard";
import Link from "next/link";
import { useEffect, useState } from "react";
import PageContainer from "@/components/layout/PageContainer";

interface PLPHeroBannerProps {
  category?: string;
}

interface ProductData {
  id: number;
  attributes: {
    Title: string;
    Description: string;
    Status: string;
    AverageRating: number | null;
    RatingCount: number | null;
    CoverImage: {
      data: {
        attributes: {
          url: string;
        };
      };
    };
    product_main_category: {
      data: {
        attributes: {
          Title: string;
          Slug: string;
        };
      };
    };
    product_variations: {
      data: Array<{
        attributes: {
          SKU: string;
          Price: string;
          IsPublished: boolean;
          general_discounts?: {
            data: Array<{
              attributes: {
                Amount: number;
              };
            }>;
          };
        };
      }>;
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
}

const MAX_HERO_PRODUCTS = 6;

const BASE_PRODUCT_FETCH_URL = `${API_BASE_URL}/products?filters[Status]=Active&populate[0]=CoverImage&populate[1]=product_main_category&populate[2]=product_variations`;

const mapProduct = (product: ProductData): ProcessedProduct => {
  const firstValidVariation = product.attributes.product_variations.data.find((variation) => {
    const price = variation.attributes.Price;
    return price && parseInt(price) > 0;
  });

  if (!firstValidVariation) {
    return {
      id: product.id,
      title: product.attributes.Title,
      category: product.attributes.product_main_category?.data?.attributes?.Title,
      likedCount: product.attributes.RatingCount || 0,
      price: 0,
      discountedPrice: 0,
      discount: 0,
      image: `${IMAGE_BASE_URL}${product.attributes.CoverImage?.data?.attributes?.url}`,
    };
  }

  const hasDiscount =
    firstValidVariation.attributes.general_discounts?.data &&
    firstValidVariation.attributes.general_discounts.data.length > 0;
  const discount =
    hasDiscount && firstValidVariation.attributes.general_discounts?.data
      ? firstValidVariation.attributes.general_discounts.data[0].attributes.Amount
      : 0;
  const price = parseInt(firstValidVariation.attributes.Price || "0");
  const discountedPrice = hasDiscount && discount ? price * (1 - discount / 100) : price;

  return {
    id: product.id,
    title: product.attributes.Title,
    category: product.attributes.product_main_category?.data?.attributes?.Title,
    likedCount: product.attributes.RatingCount || 0,
    price,
    discountedPrice,
    discount,
    image: `${IMAGE_BASE_URL}${product.attributes.CoverImage?.data?.attributes?.url}`,
  };
};

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

const fetchProductsFromUrl = async (url: string): Promise<ProcessedProduct[]> => {
  const response = await fetch(url);
  const data = await response.json();
  if (!Array.isArray(data?.data)) {
    return [];
  }

  return data.data.map((product: ProductData) => mapProduct(product)).filter((product) => product.price > 0);
};

function getFeaturedProducts(category?: string): Promise<ProcessedProduct[]> {
  let url = `${BASE_PRODUCT_FETCH_URL}&pagination[pageSize]=6`;
  url += `&filters[$or][0][Title][$containsi]=کیف&filters[$or][1][Title][$containsi]=کفش&filters[$or][2][Title][$containsi]=صندل&filters[$or][3][Title][$containsi]=کتونی`;

  if (category) {
    url += `&filters[product_main_category][Slug][$eq]=${category}`;
  }

  return fetchProductsFromUrl(url);
}

function getRandomProducts(): Promise<ProcessedProduct[]> {
  const url = `${BASE_PRODUCT_FETCH_URL}&pagination[pageSize]=20`;
  return fetchProductsFromUrl(url).then((products) => shuffle(products).slice(0, MAX_HERO_PRODUCTS));
}

export default function PLPHeroBanner({ category }: PLPHeroBannerProps) {
  const [title, setTitle] = useState("همه محصولات");
  const [imageUrl, setImageUrl] = useState("/images/PLP.webp");
  const [featuredProducts, setFeaturedProducts] = useState<ProcessedProduct[]>([]);
  const [columnCount, setColumnCount] = useState(3);

  useEffect(() => {
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
            setImageUrl(`${IMAGE_BASE_URL}${categoryAttributes.CoverImage?.data?.attributes?.url}`);
          }
        }
      } catch {
        const fallback = await getRandomProducts();
        setFeaturedProducts(fallback);
      }
    };

    fetchData();
  }, [category]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const updateColumns = () => setColumnCount(mediaQuery.matches ? 4 : 3);

    updateColumns();
    mediaQuery.addEventListener("change", updateColumns);
    return () => mediaQuery.removeEventListener("change", updateColumns);
  }, []);

  const visibleProducts = featuredProducts.slice(0, columnCount * 2);

  return (
    <div className="w-full bg-slate-50 rounded-2xl py-4">
      <PageContainer
        variant="wide"
        disablePadding
        className="space-y-3 bg-transparent px-4 pb-0 md:px-4"
      >
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="xl:grid xl:flex-1 xl:grid-cols-3 xl:justify-items-center xl:gap-3 hidden">
            {visibleProducts.map((product) => (
              <ProductSmallCard key={product.id} {...product}  />
            ))}
          </div>

          <Link href="/" className="flex-shrink-0">
            <div className="relative h-[244px] w-full overflow-hidden rounded-2xl md:w-[517px]">
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 517px"
                priority
                loader={imageUrl.startsWith("http") ? imageLoader : undefined}
              />
            </div>
          </Link>
        </div>
      </PageContainer>
    </div>
  );
}
