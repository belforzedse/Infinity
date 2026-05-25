"use client";

import dynamic from "next/dynamic";
import { formatProductsToCardProps } from "@/services/product/product";
import type { PLPProduct } from "@/components/PLP/types";

const ProductSmallCard = dynamic(() => import("@/components/Product/SmallCard"), {
  loading: () => <div className="skeleton-shimmer h-24 rounded-lg" />,
});

interface PLPMobileListProps {
  products: PLPProduct[];
}

export default function PLPMobileList({ products }: PLPMobileListProps) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      {products.map((product, index) => {
        const card = formatProductsToCardProps([product])[0];
        if (!card) return null;

        return (
          <ProductSmallCard
            key={product.id}
            id={card.id}
            slug={card.slug}
            title={card.title}
            category={card.category}
            likedCount={card.seenCount || 0}
            price={card.price}
            discountedPrice={card.discountPrice}
            discount={card.discount}
            image={card.images[0] || ""}
            isAvailable={card.isAvailable}
            priority={index < 3}
            colorsCount={card.colorsCount}
            colorCodes={card.colorCodes}
          />
        );
      })}
    </div>
  );
}
