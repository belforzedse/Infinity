"use client";

import React, { useEffect, useState, useRef } from "react";
import BlogProductCard, { type BlogProductCardProps } from "./BlogProductCard";
import { getProductsByIds, getProductsBySlugs } from "@/services/product/product";
import type { ProductCardProps } from "@/components/Product/Card";

interface BlogProductCarouselProps {
  identifiers: string[];
  className?: string;
  showErrors?: boolean; // Show error message when products not found (for preview)
}

/**
 * Blog Product Carousel Component
 * Displays products in a subtle, blog-integrated carousel
 * Supports both product IDs and slugs
 */
const BlogProductCarousel: React.FC<BlogProductCarouselProps> = ({
  identifiers,
  className = "",
  showErrors = false,
}) => {
  const [products, setProducts] = useState<BlogProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!identifiers || identifiers.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Separate IDs and slugs
        const ids: (number | string)[] = [];
        const slugs: string[] = [];

        identifiers.forEach((identifier) => {
          // Check if it's a numeric ID
          const numId = parseInt(identifier, 10);
          if (!isNaN(numId) && identifier === numId.toString()) {
            // It's a pure numeric ID
            ids.push(numId);
          } else if (identifier && identifier.trim().length > 0) {
            // It's a slug (non-empty string)
            slugs.push(identifier);
          }
          // Ignore empty strings
        });

        // Fetch both in parallel
        const [productsByIds, productsBySlugs] = await Promise.all([
          ids.length > 0 ? getProductsByIds(ids) : Promise.resolve([]),
          slugs.length > 0 ? getProductsBySlugs(slugs) : Promise.resolve([]),
        ]);

        // Combine and deduplicate by ID
        const allProducts = [...productsByIds, ...productsBySlugs];
        const uniqueProducts = allProducts.filter(
          (product, index, self) => index === self.findIndex((p) => p.id === product.id),
        );

        // Preserve order from identifiers and convert to BlogProductCardProps
        const orderedProducts: BlogProductCardProps[] = identifiers
          .map((identifier) => {
            const numId = parseInt(identifier, 10);
            const product = !isNaN(numId)
              ? uniqueProducts.find((p) => p.id === numId)
              : uniqueProducts.find((p) => p.slug === identifier);

            if (!product) return null;

            // Convert ProductCardProps to BlogProductCardProps
            const blogCard: BlogProductCardProps = {
              id: product.id,
              slug: product.slug,
              title: product.title,
              category: product.category,
              price: product.price,
              discountedPrice: product.discountPrice,
              discount: product.discount,
              image: product.images[0] || "",
              isAvailable: product.isAvailable,
              colorsCount: product.colorsCount,
            };
            return blogCard;
          })
          .filter((product): product is BlogProductCardProps => product !== null);

        setProducts(orderedProducts);

        // Debug logging
        if (process.env.NODE_ENV !== "production") {
          console.log("BlogProductCarousel - Fetched products:", {
            identifiers,
            ids,
            slugs,
            productsByIds: productsByIds.length,
            productsBySlugs: productsBySlugs.length,
            orderedProducts: orderedProducts.length,
          });
        }
      } catch (error) {
        console.error("Error fetching products for blog carousel:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [identifiers]);

  if (loading) {
    return (
      <div className={`my-6 ${className}`}>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[240px] w-[168px] flex-shrink-0 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    // Show error message in preview mode, silent fail for blog posts
    if (showErrors) {
      return (
        <div className={`my-6 rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
          <p className="text-sm text-red-600">
            محصولاتی با شناسه‌های زیر یافت نشد: {identifiers.join(", ")}
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`my-6 ${className}`}>
      <div
        ref={scrollRef}
        className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {products.map((product, index) => (
          <div key={product.id} className="flex-shrink-0 snap-start">
            <BlogProductCard {...product} priority={index === 0} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogProductCarousel;

