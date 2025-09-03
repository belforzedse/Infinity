import { useState } from "react";
import SuperAdminPagination from "../../Pagination";
import RecycleBinButton from "./Button/RecycleBin";
import AddButton from "./Button/Add";
import FilterButton from "./Button/Filter";

type Props = {
  children: React.ReactNode;
  title: string;
  titleSuffixComponent?: React.ReactNode;
  hasRecycleBin?: boolean;
  hasAddButton?: boolean;
  addButtonText?: string;
  addButtonPath?: string;
  hasFilterButton?: boolean;
  hasPagination?: boolean;
  totalPages?: number;
};

export default function SuperAdminLayoutContentWrapperMobile(props: Props) {
  const {
    children,
    title,
    hasRecycleBin,
    hasAddButton,
    addButtonText,
    addButtonPath,
    hasFilterButton,
    hasPagination,
    totalPages,
    titleSuffixComponent,
  } = props;

  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setFilterIsOpen] = useState(false);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-3xl text-[#202224]">{title}</span>

          {hasRecycleBin && <RecycleBinButton count={0} />}
        </div>

        <div className="w-full">{titleSuffixComponent}</div>

        <div className="flex items-center gap-2">
          {hasAddButton && (
            <div className="flex-1">
              <AddButton text={addButtonText ?? ""} path={addButtonPath} />
            </div>
          )}

          {hasFilterButton && (
            <div className="flex-1">
              <FilterButton
                options={[]}
                isFilterOpen={isFilterOpen}
                setFilterIsOpen={setFilterIsOpen}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">{children}</div>

      {hasPagination && (
        <SuperAdminPagination
          className="mt-4"
          currentPage={currentPage}
          totalPages={totalPages ?? 1}
          onPageChange={handlePageChange}
        />
      )}
    </>
  );
}
