"use client";

import dynamic from "next/dynamic";
import { formatProductsToCardProps } from "@/services/product/product";
import type { PLPProduct } from "@/components/PLP/types";
import { StorefrontGrid } from "@/components/storefront";

const ProductCard = dynamic(() => import("@/components/Product/Card"), {
  loading: () => <div className="skeleton-shimmer h-48 rounded-lg" />,
});

interface PLPDesktopListProps {
  products: PLPProduct[];
  includeMedia: boolean;
}

export default function PLPDesktopList({ products, includeMedia }: PLPDesktopListProps) {
  return (
    <StorefrontGrid variant="plp" className="hidden md:grid">
      {products.map((product, index) => {
        const card = formatProductsToCardProps([product])[0];
        if (!card) return null;

        return (
          <ProductCard
            key={product.id}
            {...card}
            images={includeMedia ? card.images : card.images.slice(0, 1)}
            priority={index < 6}
          />
        );
      })}
    </StorefrontGrid>
  );
}
