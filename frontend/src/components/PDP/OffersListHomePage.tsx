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

  function getPlpHref(): string {
    // Map known section titles to PLP filters/sort
    if (title.includes("تخفیف")) {
      return "/plp?hasDiscount=true";
    }
    if (title.includes("جدید")) {
      return "/plp?sort=createdAt:desc";
    }
    if (title.includes("محبوب")) {
      return "/plp?sort=AverageRating:desc";
    }
    return "/plp";
  }

  // Display only first 8 products on desktop in grid layout
  const displayedProducts = isShowAllProducts
    ? products
    : products.slice(0, isShowAllProducts ? products.length : 8);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {icon}
          <span className="text-2xl text-foreground-primary md:text-3xl">
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

          {/* Desktop: navigate to PLP with appropriate filters */}
          <Link
            href={getPlpHref()}
            className="text-sm hidden text-pink-600 hover:underline md:block"
          >
            مشاهده همه
          </Link>
        </div>
      </div>

      {/* Mobile scrollable view */}
      <div className="md:hidden">
        <div
          ref={scrollRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-5 overflow-x-auto"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {products.map((product) => (
            <div key={product.id} className="snap-start">
              <ProductCard {...product} />
            </div>
          ))}
        </div>

        {!isShowAllProducts && products.length > 4 && (
          <div className="mt-4 flex items-center justify-center">
            <Link
              href={getPlpHref()}
              className="text-base flex items-center gap-1 text-foreground-primary"
            >
              <span>مشاهده همه</span>
              <ArrowLeftIcon />
            </Link>
          </div>
        )}
      </div>

      {/* Desktop grid view */}
      <div className="hidden gap-4 gap-y-6 md:grid md:grid-cols-2 lg:grid-cols-4">
        {displayedProducts.map((product) => (
          <div key={product.id} className="h-full">
            <ProductCard {...product} />
          </div>
        ))}
      </div>

      {/* Desktop view more button */}
      {!isShowAllProducts && products.length > 8 && (
        <div className="mt-6 hidden items-center justify-center md:flex">
          <Link
            href={getPlpHref()}
            className="text-base flex items-center gap-1 rounded-full border border-pink-100 px-4 py-2 text-foreground-primary transition-colors hover:bg-pink-50 hover:text-pink-600"
          >
            <span>مشاهده محصولات بیشتر</span>
            <ArrowLeftIcon />
          </Link>
        </div>
      )}
    </div>
  );
}
