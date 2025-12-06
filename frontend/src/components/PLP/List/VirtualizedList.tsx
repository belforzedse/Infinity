"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ListChildComponentProps } from "react-window";
import ProductCard from "@/components/Product/Card";
import ProductSmallCard from "@/components/Product/SmallCard";
import { IMAGE_BASE_URL } from "@/constants/api";
import dynamic from "next/dynamic";

// Dynamically import react-window to avoid build/SSR issues
// Using dynamic import with ssr: false since react-window is client-only
const List = dynamic(
  () => import("react-window").then((mod: any) => {
    // react-window exports FixedSizeList as a named export
    return mod.FixedSizeList || mod.default?.FixedSizeList || mod.default;
  }) as Promise<React.ComponentType<any>>,
  {
    ssr: false, // Client-only component, no SSR needed
  }
);

interface Product {
  id: number;
  attributes: {
    Title: string;
    RatingCount: number | null;
    CoverImage?: {
      data?: {
        attributes?: {
          url?: string;
        };
      };
    };
    product_main_category?: {
      data?: {
        attributes?: {
          Title?: string;
        };
      };
    };
    product_variations?: {
      data?: Array<{
        attributes: {
          Price: string;
          DiscountPrice?: string;
          general_discounts?: {
            data: Array<{
              attributes: {
                Amount: number;
              };
            }>;
          };
          product_stock?: {
            data?: {
              attributes?: {
                Count?: number;
              };
            };
          };
        };
      }>;
    };
  };
};

interface VirtualizedListProps {
  products: Product[];
  checkStockAvailability: (product: Product) => boolean;
  containerHeight?: number;
}

export default function VirtualizedList({
  products,
  checkStockAvailability: checkStockAvailabilityProp,
  containerHeight = 800,
}: VirtualizedListProps) {
  // Process products into a format suitable for rendering
  const processedProducts = useMemo(() => {
    return products.map((product) => {
      const firstValidVariation = product.attributes.product_variations?.data?.find(
        (variation) => {
          const price = variation.attributes.Price;
          return price && parseInt(price) > 0;
        },
      );

      const price = parseInt(firstValidVariation?.attributes?.Price || "0");

      const generalDiscounts = firstValidVariation?.attributes?.general_discounts?.data;
      let discountPrice = undefined;
      let discount = undefined;

      if (generalDiscounts && generalDiscounts.length > 0) {
        const discountAmount = generalDiscounts[0].attributes.Amount;
        discount = discountAmount;
        discountPrice = Math.round(price * (1 - discountAmount / 100));
      } else if (firstValidVariation?.attributes?.DiscountPrice) {
        discountPrice = parseInt(firstValidVariation.attributes.DiscountPrice);
        const hasDiscount = discountPrice && discountPrice < price;
        discount = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : undefined;
      }

      const isAvailable = checkStockAvailabilityProp(product as any);

      return {
        id: product.id,
        title: product.attributes.Title,
        category: product.attributes.product_main_category?.data?.attributes?.Title || "",
        price,
        discountPrice,
        discount,
        seenCount: product.attributes.RatingCount || 0,
        colorsCount: product.attributes.product_variations?.data?.length || 0,
        image:
          product.attributes.CoverImage?.data?.attributes?.url
            ? `${IMAGE_BASE_URL}${product.attributes.CoverImage.data.attributes.url}`
            : "",
        images: product.attributes.CoverImage?.data?.attributes?.url
          ? [`${IMAGE_BASE_URL}${product.attributes.CoverImage.data.attributes.url}`]
          : [""],
        isAvailable,
      };
    });
  }, [products, checkStockAvailabilityProp]);

  // Desktop row renderer
  const DesktopRow = ({ index, style }: ListChildComponentProps) => {
    const product = processedProducts[index];
    if (!product) return null;

    return (
      <div style={style} className="px-2">
        <ProductCard
          key={product.id}
          id={product.id}
          images={product.images}
          category={product.category}
          title={product.title}
          price={product.price}
          seenCount={product.seenCount}
          discount={product.discount}
          discountPrice={product.discountPrice}
          colorsCount={product.colorsCount}
          isAvailable={product.isAvailable}
          priority={index < 6}
        />
      </div>
    );
  };

  // Mobile row renderer
  const MobileRow = ({ index, style }: ListChildComponentProps) => {
    const product = processedProducts[index];
    if (!product) return null;

    return (
      <div style={style} className="px-3">
        <ProductSmallCard
          key={product.id}
          id={product.id}
          title={product.title}
          category={product.category}
          likedCount={product.seenCount}
          price={product.price}
          discountedPrice={product.discountPrice}
          discount={product.discount}
          image={product.image}
          isAvailable={product.isAvailable}
          priority={index < 3}
        />
      </div>
    );
  };

  // Track viewport width on client to avoid SSR flicker and respond to resize/orientation changes
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);

  useEffect(() => {
    const updateWidth = () => setViewportWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    window.addEventListener("orientationchange", updateWidth);
    return () => {
      window.removeEventListener("resize", updateWidth);
      window.removeEventListener("orientationchange", updateWidth);
    };
  }, []);

  const isMobile = (viewportWidth ?? Infinity) < 768;
  const DESKTOP_ITEM_HEIGHT = 420;
  const MOBILE_ITEM_HEIGHT = 140;
  const itemHeight = isMobile ? MOBILE_ITEM_HEIGHT : DESKTOP_ITEM_HEIGHT;
  const itemCount = processedProducts.length;

  // Calculate grid columns for desktop; default to 4 during SSR to avoid layout jump
  const desktopColumns = useMemo(() => {
    if (viewportWidth === null) return 4;
    if (viewportWidth >= 1280) return 4; // xl
    if (viewportWidth >= 1024) return 3; // lg
    return 2; // md
  }, [viewportWidth]);
  const desktopItemWidth = `calc((100% - ${(desktopColumns - 1) * 16}px) / ${desktopColumns})`;

  if (itemCount === 0) return null;

  return (
    <>
      {/* Desktop view - Virtualized grid */}
      <div className="hidden md:block">
        <List
          height={containerHeight}
          itemCount={Math.ceil(itemCount / desktopColumns)}
          itemSize={DESKTOP_ITEM_HEIGHT + 16}
          width="100%"
        >
          {({ index, style }: ListChildComponentProps) => {
            const rowStart = index * desktopColumns;
            const rowProducts = processedProducts.slice(rowStart, rowStart + desktopColumns);

            return (
              <div style={style} className="flex gap-4">
                {rowProducts.map((product, colIndex) => (
                  <div key={product.id} style={{ width: desktopItemWidth }}>
                    <ProductCard
                      id={product.id}
                      images={product.images}
                      category={product.category}
                      title={product.title}
                      price={product.price}
                      seenCount={product.seenCount}
                      discount={product.discount}
                      discountPrice={product.discountPrice}
                      colorsCount={product.colorsCount}
                      isAvailable={product.isAvailable}
                      priority={rowStart + colIndex < 6}
                    />
                  </div>
                ))}
                {/* Fill empty slots in last row */}
                {rowProducts.length < desktopColumns &&
                  Array.from({ length: desktopColumns - rowProducts.length }).map((_, i) => (
                    <div key={`empty-${i}`} style={{ width: desktopItemWidth }} />
                  ))}
              </div>
            );
          }}
        </List>
      </div>

      {/* Mobile view - Virtualized list */}
      <div className="md:hidden">
        <List
          height={containerHeight}
          itemCount={itemCount}
          itemSize={MOBILE_ITEM_HEIGHT + 12}
          width="100%"
        >
          {MobileRow}
        </List>
      </div>
    </>
  );
}

