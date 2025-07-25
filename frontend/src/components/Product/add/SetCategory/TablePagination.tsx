import { useState } from "react";
import Select, { Option } from "@/components/Kits/Form/Select";
import { cn } from "@/utils/tailwind";
import ChevronRightIcon from "../../Icons/ChevronRightIcon";
import ChavronLeftIcon from "../../Icons/ChevronLeftIcon";

interface SetCategoryTablePaginationProps {
  totalItems: number;
  itemsPerPage?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (value: number) => void;
  className?: string;
}

const SetCategoryTablePagination: React.FC<SetCategoryTablePaginationProps> = ({
  totalItems,
  itemsPerPage = 10,
  currentPage = 1,
  onPageChange,
  onItemsPerPageChange,
  className,
}) => {
  const [selectedPerPage, setSelectedPerPage] = useState<Option>({
    id: itemsPerPage,
    name: `نمایش ۱ تا ${itemsPerPage} رکورد محصول`,
  });

  const perPageOptions: Option[] = [
    { id: 25, name: "نمایش ۲۵ رکورد" },
    { id: 50, name: "نمایش ۵۰ رکورد" },
    { id: 100, name: "نمایش ۱۰۰ رکورد" },
    { id: 200, name: "نمایش ۲۰۰ رکورد" },
  ];

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [currentPageState, setCurrentPageState] = useState(currentPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPageState(page);
      onPageChange?.(page);
    }
  };

  const handlePerPageChange = (option: Option) => {
    setSelectedPerPage(option);
    onItemsPerPageChange?.(Number(option.id));
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPageState - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Show first page
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className={cn(
            "h-[26px] w-[26px] rounded-3xl text-xs flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:bg-gray-100"
          )}
        >
          1
        </button>
      );

      if (startPage > 2) {
        pages.push(
          <button
            key="ellipsis-start"
            className="h-[26px] w-[26px] rounded-3xl text-xs flex items-center justify-center bg-white border border-slate-200 text-slate-400"
          >
            ...
          </button>
        );
      }
    }

    // Current pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={cn(
            "h-[26px] w-[26px] rounded-3xl text-xs flex items-center justify-center bg-white border border-slate-200 text-slate-400",
            currentPageState === i
              ? "bg-actions-primary text-white border-actions-primary"
              : "hover:bg-gray-100"
          )}
        >
          {i}
        </button>
      );
    }

    // Show last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <button
            key="ellipsis-end"
            className="h-[26px] w-[26px] rounded-3xl text-xs flex items-center justify-center bg-white border border-slate-200 text-slate-400"
          >
            ...
          </button>
        );
      }

      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={cn(
            "h-[26px] w-[26px] rounded-3xl text-xs flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:bg-gray-100"
          )}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center">
        <Select
          value={selectedPerPage}
          onChange={handlePerPageChange}
          options={perPageOptions}
          className="w-48"
          selectButtonClassName="max-h-10 py-1 min-h-10"
        />
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => handlePageChange(currentPageState + 1)}
          disabled={currentPageState === totalPages}
          className="border rounded-3xl p-1 disabled:opacity-50 border-slate-200 bg-white text-slate-400"
        >
          <ChevronRightIcon />
        </button>

        <div className="flex flex-row-reverse items-center gap-1">
          {renderPageNumbers()}
        </div>

        <button
          onClick={() => handlePageChange(currentPageState - 1)}
          disabled={currentPageState === 1}
          className="border rounded-3xl p-1 disabled:opacity-50 border-slate-200 bg-white text-slate-400"
        >
          <ChavronLeftIcon />
        </button>
      </div>
    </div>
  );
};

export default SetCategoryTablePagination;
