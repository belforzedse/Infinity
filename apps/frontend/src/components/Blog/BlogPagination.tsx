"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BlogPaginationProps {
  total: number;
  current: number;
  onPageChange: (page: number) => void;
  onNext: () => void;
  onPrev: () => void;
  className?: string;
}

const BlogPagination: React.FC<BlogPaginationProps> = ({
  total,
  current,
  onPageChange,
  onNext,
  onPrev,
  className = "",
}) => {
  if (total <= 1) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Previous Button */}
      <button
        onClick={onPrev}
        disabled={current === 0}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-pink-200 bg-white text-pink-600 transition-colors hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
        aria-label="صفحه قبلی"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Next Button */}
      <button
        onClick={onNext}
        disabled={current === total - 1}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-pink-200 bg-white text-pink-600 transition-colors hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
        aria-label="صفحه بعدی"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  );
};

export default BlogPagination;
