"use client";

import ChevronLeftIcon from "@/components/PDP/Icons/ChevronLeftIcon";
import ChevronRightIcon from "@/components/PDP/Icons/ChevronRightIcon";
import { cn } from "@/lib/utils";
import { scrollIntoViewWithOffset } from "@/utils/scroll";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function PLPPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  // Don't render if there's only one page or no pages
  if (totalPages <= 1) return null;

  // Generate page numbers with smart ellipsis logic
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7; // Show max 7 page numbers

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination with ellipsis
      if (currentPage <= 4) {
        // Show first 5 pages + ellipsis + last page
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Show first page + ellipsis + last 5 pages
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show first + ellipsis + current-1, current, current+1 + ellipsis + last
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    const anchor = document.querySelector<HTMLElement>("[data-plp-top]");
    if (anchor) {
      scrollIntoViewWithOffset(anchor);
      return;
    }

    scrollIntoViewWithOffset(null, { fallbackTop: 0 });
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      scrollToTop();
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      scrollToTop();
    }
  };

  return (
    <div className={cn("mt-8 flex items-center justify-center", className)}>
      <div className="flex items-center space-x-1 rtl:space-x-reverse">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
            currentPage === 1
              ? "cursor-not-allowed  text-gray-400"
              : " text-gray-700 hover:border-gray-400 hover:bg-gray-50",
          )}
          aria-label="صفحه قبلی"
        >
          <ChevronRightIcon color={currentPage === 1 ? "#9CA3AF" : "#374151"} />
        </button>

        {/* Page Numbers */}
        <div className="mx-2 flex items-center space-x-1 rtl:space-x-reverse">
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-8 w-8 items-center justify-center text-gray-500"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => {
                  onPageChange(pageNum);
                  scrollToTop();
                }}
                className={cn(
                  "text-sm flex h-8 w-8 items-center justify-center rounded-full font-medium transition-colors",
                  isActive
                    ? "bg-pink-500  text-white"
                    : " text-gray-700 hover:border-gray-400 hover:bg-gray-50",
                )}
                aria-label={`صفحه ${pageNum}`}
                aria-current={isActive ? "page" : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md  transition-colors",
            currentPage === totalPages
              ? "cursor-not-allowed  text-gray-400"
              : " text-gray-700  hover:bg-gray-50",
          )}
          aria-label="صفحه بعدی"
        >
          <ChevronLeftIcon color={currentPage === totalPages ? "#9CA3AF" : "#374151"} />
        </button>
      </div>


    </div>
  );
}
