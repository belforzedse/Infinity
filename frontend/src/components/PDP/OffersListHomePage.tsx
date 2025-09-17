"use client";
import ProductCard, { type ProductCardProps } from "@/components/Product/Card";
import PDPHeroNavigationButtons from "./NavigationButtons";
import { useRef } from "react";
import ArrowLeftIcon from "./Icons/ArrowLeftIcon";
import Link from "next/link";

type Props = {
  icon: React.ReactNode;
  title: string;
  products: ProductCardProps[];
};

export default function OffersListHomePage(props: Props) {
  const { icon, title, products } = props;

  const scrollRef = useRef<HTMLDivElement>(null);

  // Controls whether to show all products or a subset.
  // Defaults to showing a subset on the homepage sections.
  const isShowAllProducts = false;

  function goToNextProduct() {
    if (scrollRef.current) {
      // Check if we're on mobile or desktop
      const isMobile = window.innerWidth < 768;
      // Mobile: Card width (259px) + gap (20px) = 279px per card
      // Desktop: Card width (256px) + gap (16px) = 272px per card
      const cardSize = isMobile ? 279 : 272;
      // Scroll by 4 cards worth of space
      const scrollAmount = cardSize * 4;
      scrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  }

  function goToPreviousProduct() {
    if (scrollRef.current) {
      // Check if we're on mobile or desktop
      const isMobile = window.innerWidth < 768;
      // Mobile: Card width (259px) + gap (20px) = 279px per card
      // Desktop: Card width (256px) + gap (16px) = 272px per card
      const cardSize = isMobile ? 279 : 272;
      // Scroll by 4 cards worth of space
      const scrollAmount = cardSize * 4;
      scrollRef.current.scrollBy({
        left: -scrollAmount,
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
  const displayedProducts =
    isShowAllProducts ? products : (
      products.slice(0, isShowAllProducts ? products.length : 4)
    );

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
            className="text-sm hidden text-pink-600 underline-offset-4 transition-colors hover:text-pink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:block"
          >
            مشاهده همه
          </Link>
        </div>
      </div>

      {/* Mobile scrollable view */}
      <div className="md:hidden overflow-hidden">
        <div
          ref={scrollRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            width: "1096px", // 4 * 259px + 3 * 20px = 1036px + 60px = 1096px
            maxWidth: "100vw",
          }}
        >
          {products.map((product) => (
            <div key={product.id} className="snap-start flex-shrink-0">
              <ProductCard {...product} />
            </div>
          ))}
        </div>

        {!isShowAllProducts && products.length > 4 && (
          <div className="mt-4 flex items-center justify-center">
            <Link
              href={getPlpHref()}
              className="text-base flex items-center gap-1 text-foreground-primary underline-offset-4 transition-colors hover:text-pink-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <span>مشاهده همه</span>
              <ArrowLeftIcon />
            </Link>
          </div>
        )}
      </div>

      {/* Desktop horizontal scroll view */}
      <div className="hidden md:block overflow-hidden">
        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            width: "1072px", // 4 * 256px + 3 * 16px = 1024px + 48px = 1072px
            maxWidth: "100%",
          }}
        >
          {products.map((product) => (
            <div key={product.id} className="snap-start flex-shrink-0 w-64">
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop view more button */}
      {!isShowAllProducts && products.length > 8 && (
        <div className="mt-6 hidden items-center justify-center md:flex">
          <Link
            href={getPlpHref()}
            className="pressable text-base flex items-center gap-1 rounded-full border border-pink-100 px-4 py-2 text-foreground-primary transition-colors hover:bg-pink-50 hover:text-pink-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <span>مشاهده محصولات بیشتر</span>
            <ArrowLeftIcon />
          </Link>
        </div>
      )}
    </div>
  );
}
