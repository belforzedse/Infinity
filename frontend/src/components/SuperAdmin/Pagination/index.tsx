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
          className="border rounded-3xl p-1 disabled:opacity-50 border-slate-200 bg-white"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRightIcon />
        </button>
        <div className="flex flex-row-reverse items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                className={cn(
                  "h-8 w-8 rounded-3xl text-xs flex items-center justify-center bg-white border border-slate-200 text-slate-400",
                  currentPage === pageNumber
                    ? "bg-actions-primary text-white"
                    : "hover:bg-gray-100"
                )}
                onClick={() => handlePageChange(pageNumber)}
              >
                {pageNumber}
              </button>
            )
          )}
        </div>
        <button
          className="border rounded-3xl p-1 disabled:opacity-50 border-slate-200 bg-white"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeftIcon />
        </button>
      </div>
    </div>
  );
}
