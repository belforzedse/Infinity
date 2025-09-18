"use client";
import ProductCard, { type ProductCardProps } from "@/components/Product/Card";
import PDPHeroNavigationButtons from "./NavigationButtons";
import { useRef, useState, useEffect } from "react";
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
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);

  // Controls whether to show all products or a subset.
  // Defaults to showing a subset on the homepage sections.
  const isShowAllProducts = false;

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setCurrentPage(0); // Reset to first page on resize
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate pagination - responsive products per page
  const getProductsPerPage = () => {
    if (windowWidth >= 1440) return 5; // 1440px+ (5 products)
    if (windowWidth >= 1024) return 4; // 1024-1440px (4 products)
    if (windowWidth >= 768) return 3;  // tablets (3 products)
    return 2; // phones (2 products)
  };

  const productsPerPage = getProductsPerPage();
  const totalPages = Math.ceil(products.length / productsPerPage);
  const startIndex = currentPage * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  function goToNextProduct() {
    // Check if we're on mobile or desktop
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // Mobile: Original scroll behavior
      if (scrollRef.current) {
        const cardSize = 279; // Card width (259px) + gap (20px)
        const scrollAmount = cardSize * 5;
        scrollRef.current.scrollBy({
          left: scrollAmount,
          behavior: "smooth",
        });
      }
    } else {
      // Desktop: Pagination - go to next page
      if (currentPage < totalPages - 1 && !isAnimating) {
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentPage(currentPage + 1);
          setTimeout(() => setIsAnimating(false), 50);
        }, 150);
      }
    }
  }

  function goToPreviousProduct() {
    // Check if we're on mobile or desktop
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // Mobile: Original scroll behavior
      if (scrollRef.current) {
        const cardSize = 279; // Card width (259px) + gap (20px)
        const scrollAmount = cardSize * 5;
        scrollRef.current.scrollBy({
          left: -scrollAmount,
          behavior: "smooth",
        });
      }
    } else {
      // Desktop: Pagination - go to previous page
      if (currentPage > 0 && !isAnimating) {
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentPage(currentPage - 1);
          setTimeout(() => setIsAnimating(false), 50);
        }, 150);
      }
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

  // Display only first 10 products on desktop in grid layout (2 rows of 5)
  const displayedProducts =
    isShowAllProducts ? products : (
      products.slice(0, isShowAllProducts ? products.length : 5)
    );

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.95);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .smooth-scroll {
          scroll-behavior: smooth;
          transition: scroll-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
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

          {/* Desktop pagination indicator */}
          {totalPages > 1 && (
            <div className="hidden md:flex items-center gap-1 text-xs text-neutral-500">
              <span>{currentPage + 1}</span>
              <span>/</span>
              <span>{totalPages}</span>
            </div>
          )}

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
      <div className="md:hidden overflow-hidden w-full">
        <div
          ref={scrollRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth smooth-scroll transition-transform duration-300 ease-out"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            width: "100%",
            maxWidth: "none",
          }}
        >
          {products.map((product, index) => (
            <div
              key={product.id}
              className="snap-start flex-shrink-0 transform transition-all duration-200 ease-out hover:scale-[1.02]"
              style={{
                animationDelay: `${index * 60}ms`,
                animation: `fadeInUp 0.3s ease-out forwards ${index * 60}ms`
              }}
            >
              <ProductCard {...product} />
            </div>
          ))}
        </div>

        {!isShowAllProducts && products.length > 5 && (
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

      {/* Desktop grid view - responsive columns */}
      <div className="hidden md:block">
        <div
          ref={scrollRef}
          className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 transition-all duration-300 ease-out ${
            isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          {currentProducts.map((product, index) => (
            <div
              key={product.id}
              className="transform transition-all duration-200 ease-out hover:scale-[1.02] hover:-translate-y-1"
            >
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop view more button */}
      {!isShowAllProducts && products.length > 5 && (
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
    </>
  );
}
