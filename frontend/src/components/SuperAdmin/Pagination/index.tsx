"use client";

import { cn } from "@/utils/tailwind";
import SuperAdminTableSelect from "../Table/Select";
import ChevronRightIcon from "../Layout/Icons/ChevronRightIcon";
import ChevronLeftIcon from "../Layout/Icons/ChevronLeftIcon";
import { useQueryState } from "nuqs";
import { useEffect } from "react";

interface PaginationProps {
  className?: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function SuperAdminPagination({
  className,
  currentPage,
  onPageChange,
}: PaginationProps) {
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });
  const [pageSize, setPageSize] = useQueryState("pageSize", {
    defaultValue: "25",
  });
  const [totalSize] = useQueryState("totalSize", {
    defaultValue: 0,
    parse: (value) => parseInt(value || "0"),
    serialize: (value) => value.toString(),
  });

  const totalPages = Math.ceil(totalSize / +pageSize);

  useEffect(() => {
    const pageNumber = parseInt(page);
    if (pageNumber !== currentPage) {
      onPageChange(pageNumber);
    }
  }, [page, currentPage, onPageChange]);

  const handlePageChange = async (newPage: number) => {
    await setPage(newPage.toString());
  };

  const handlePageSizeChange = async (size: number) => {
    await setPageSize(size.toString());
    await setPage("1"); // Reset to first page when changing page size
  };

  // Generate compact page items with ellipsis
  const getPageItems = (): (number | string)[] => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items: (number | string)[] = [];
    const first = 1;
    const last = totalPages;

    if (currentPage <= 3) {
      // 1,2,3,4,...,last
      items.push(1, 2, 3, 4, "…", last);
      return items;
    }

    if (currentPage >= totalPages - 2) {
      // first, ..., last-3,last-2,last-1,last
      items.push(first, "…", last - 3, last - 2, last - 1, last);
      return items;
    }

    // first, ..., current-1,current,current+1, ..., last
    items.push(
      first,
      "…",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "…",
      last,
    );
    return items;
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <SuperAdminTableSelect
        options={[
          { id: 25, title: "نمایش ۲۵ رکورد" },
          { id: 10, title: "نمایش ۱۰ رکورد" },
          { id: 50, title: "نمایش ۵۰ رکورد" },
          { id: 100, title: "نمایش ۱۰۰ رکورد" },
        ]}
        onOptionSelect={(optionId) => handlePageSizeChange(optionId as number)}
      />
      <div className="flex items-center gap-2">
        <button
          className="rounded-3xl border border-slate-200 bg-white p-1 disabled:opacity-50"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRightIcon />
        </button>
        <div className="flex flex-row-reverse items-center gap-1">
          {getPageItems().map((item, idx) => {
            if (typeof item === "string") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className={
                    "text-xs flex h-8 w-8 select-none items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-400"
                  }
                >
                  {item}
                </span>
              );
            }

            const pageNumber = item as number;
            return (
              <button
                key={pageNumber}
                className={cn(
                  "text-xs flex h-8 w-8 items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-400",
                  currentPage === pageNumber
                    ? "bg-actions-primary text-white"
                    : "hover:bg-gray-100",
                )}
                onClick={() => handlePageChange(pageNumber)}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>
        <button
          className="rounded-3xl border border-slate-200 bg-white p-1 disabled:opacity-50"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeftIcon />
        </button>
      </div>
    </div>
  );
}
