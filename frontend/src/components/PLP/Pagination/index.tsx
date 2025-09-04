"use client";

import ChevronLeftIcon from "@/components/PDP/Icons/ChevronLeftIcon";
import ChevronRightIcon from "@/components/PDP/Icons/ChevronRightIcon";
import { cn } from "@/lib/utils";

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

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={cn("flex items-center justify-center mt-8", className)}>
      <div className="flex items-center space-x-1 rtl:space-x-reverse">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-md border transition-colors",
            currentPage === 1
              ? "border-gray-200 text-gray-400 cursor-not-allowed"
              : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          )}
          aria-label="صفحه قبلی"
        >
          <ChevronRightIcon color={currentPage === 1 ? "#9CA3AF" : "#374151"} />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1 rtl:space-x-reverse mx-2">
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="flex items-center justify-center w-8 h-8 text-gray-500"
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
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white border border-primary"
                    : "text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400"
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
            "flex items-center justify-center w-8 h-8 rounded-md border transition-colors",
            currentPage === totalPages
              ? "border-gray-200 text-gray-400 cursor-not-allowed"
              : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          )}
          aria-label="صفحه بعدی"
        >
          <ChevronLeftIcon color={currentPage === totalPages ? "#9CA3AF" : "#374151"} />
        </button>
      </div>

      {/* Page Info - Mobile Only */}
      <div className="md:hidden mt-2 text-sm text-gray-600 text-center">
        صفحه {currentPage} از {totalPages}
      </div>
    </div>
  );
}
