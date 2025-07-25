"use client";
import ProductCard, { type ProductCardProps } from "@/components/Product/Card";
import PDPHeroNavigationButtons from "./NavigationButtons";
import { useRef, useState } from "react";
import ArrowLeftIcon from "./Icons/ArrowLeftIcon";
import Link from "next/link";

type Props = {
  icon: React.ReactNode;
  title: string;
  products: ProductCardProps[];
};

export default function OffersListHomePage(props: Props) {
  const { icon, title, products } = props;

  const [isShowAllProducts, setIsShowAllProducts] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function goToNextProduct() {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollLeft + 400,
        behavior: "smooth",
      });
    }
  }

  function goToPreviousProduct() {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollLeft - 400,
        behavior: "smooth",
      });
    }
  }

  // Display only first 8 products on desktop in grid layout
  const displayedProducts = isShowAllProducts
    ? products
    : products.slice(0, isShowAllProducts ? products.length : 8);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 items-center">
          {icon}
          <span className="text-foreground-primary text-2xl md:text-3xl">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <PDPHeroNavigationButtons
              goToNextImage={goToNextProduct}
              goToPreviousImage={goToPreviousProduct}
            />
          </div>

          <Link
            href={`/plp?collection=${title}`}
            className="hidden md:block text-pink-600 text-sm hover:underline"
          >
            مشاهده همه
          </Link>
        </div>
      </div>

      {/* Mobile scrollable view */}
      <div className="md:hidden">
        <div
          ref={scrollRef}
          className="gap-5 overflow-x-auto flex snap-x snap-mandatory scrollbar-hide"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/pdp/${product.id}`}
              className="snap-start"
            >
              <ProductCard {...product} />
            </Link>
          ))}
        </div>

        {!isShowAllProducts && products.length > 4 && (
          <div className="flex items-center justify-center mt-4">
            <button
              className="text-foreground-primary text-base flex items-center gap-1"
              onClick={() => setIsShowAllProducts(true)}
            >
              <span>مشاهده همه</span>
              <ArrowLeftIcon />
            </button>
          </div>
        )}
      </div>

      {/* Desktop grid view */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 gap-y-6">
        {displayedProducts.map((product) => (
          <Link key={product.id} href={`/pdp/${product.id}`} className="h-full">
            <ProductCard {...product} />
          </Link>
        ))}
      </div>

      {/* Desktop view more button */}
      {!isShowAllProducts && products.length > 8 && (
        <div className="hidden md:flex items-center justify-center mt-6">
          <button
            className="text-foreground-primary text-base flex items-center gap-1 hover:text-pink-600 transition-colors py-2 px-4 border border-pink-100 rounded-full hover:bg-pink-50"
            onClick={() => setIsShowAllProducts(true)}
          >
            <span>مشاهده محصولات بیشتر</span>
            <ArrowLeftIcon />
          </button>
        </div>
      )}
    </div>
  );
}
