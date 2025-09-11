"use client";

import { API_BASE_URL, IMAGE_BASE_URL } from "@/constants/api";
import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import ProductSmallCard from "../Product/SmallCard";
import Link from "next/link";
import { useEffect, useState } from "react";

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

function getFeaturedProducts(category?: string): Promise<ProcessedProduct[]> {
  let url = `${API_BASE_URL}/products?filters[Status]=Active&populate[0]=CoverImage&populate[1]=product_main_category&populate[2]=product_variations&pagination[pageSize]=6`;

  if (category) {
    url += `&filters[product_main_category][Slug][$eq]=${category}`;
  }

  return fetch(url)
    .then((response) => response.json())
    .then((data) => {
      // Filter out products with zero price
      const filteredProducts = data.data.filter((product: ProductData) => {
        // Check if any variation has a valid price
        return product.attributes.product_variations?.data?.some(
          (variation) => {
            const price = variation.attributes.Price;
            return price && parseInt(price) > 0;
          },
        );
      });

      return filteredProducts.map((product: ProductData) => {
        // Find the first variation with a valid price
        const firstValidVariation =
          product.attributes.product_variations.data.find((variation) => {
            const price = variation.attributes.Price;
            return price && parseInt(price) > 0;
          });

        const hasDiscount =
          firstValidVariation?.attributes?.general_discounts?.data &&
          firstValidVariation.attributes.general_discounts.data.length > 0;
        const discount =
          hasDiscount && firstValidVariation.attributes.general_discounts?.data
            ? firstValidVariation.attributes.general_discounts.data[0]
                .attributes.Amount
            : 0;
        const price = parseInt(firstValidVariation?.attributes?.Price || "0");
        const discountedPrice =
          hasDiscount && discount ? price * (1 - discount / 100) : price;

        return {
          id: product.id,
          title: product.attributes.Title,
          category:
            product.attributes.product_main_category?.data?.attributes?.Title,
          likedCount: product.attributes.RatingCount || 0,
          price,
          discountedPrice,
          discount,
          image: `${IMAGE_BASE_URL}${product.attributes.CoverImage?.data?.attributes?.url}`,
        };
      });
    });
}

export default function PLPHeroBanner({ category }: PLPHeroBannerProps) {
  const [title, setTitle] = useState("همه محصولات");
  const [imageUrl, setImageUrl] = useState("/images/off-section.png");
  const [featuredProducts, setFeaturedProducts] = useState<ProcessedProduct[]>(
    [],
  );

  useEffect(() => {
    // Fetch both category data and featured products in parallel
    Promise.all([
      category
        ? fetch(
            `${API_BASE_URL}/product-categories?filters[Slug][$eq]=${category}`,
          ).then((res) => res.json())
        : Promise.resolve({ data: [] }),
      getFeaturedProducts(category),
    ])
      .then(([categoryData, products]) => {
        setFeaturedProducts(products);

        if (category && categoryData.data.length > 0) {
          const categoryAttributes = categoryData.data[0].attributes;
          setTitle(categoryAttributes.Title);

          if (categoryAttributes.CoverImage?.data?.attributes?.url) {
            setImageUrl(
              `${IMAGE_BASE_URL}${categoryAttributes.CoverImage?.data?.attributes?.url}`,
            );
          }
        }
      })
      .catch(() => {
        // Keep UI usable on failures
        setFeaturedProducts([]);
      });
  }, [category]);

  return (
    <div className="w-full bg-background-secondary p-4 md:px-10 md:py-6">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 md:flex-row">
        <div className="flex flex-1 flex-wrap gap-3 pt-4 md:pt-0">
          {featuredProducts.map((product) => (
            <ProductSmallCard key={product.id} {...product} />
          ))}
        </div>

        <Link href="/">
          <div className="relative h-[244px] w-full overflow-hidden rounded-2xl md:w-[517px]">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 517px"
              priority
              loader={imageLoader}
            />
          </div>
        </Link>
      </div>
    </div>
  );
}
