"use client";

import { useEffect, useState } from "react";
import SuperAdminPagination from "../../Pagination";
import RecycleBinButton from "./Button/RecycleBin";
import AddButton from "./Button/Add";
import FilterButton from "./Button/Filter";
import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";
import { refreshTable } from "../../Table";
import { useAtom } from "jotai";

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
  apiUrl?: string;
  isRecycleBinOpen?: boolean;
  setIsRecycleBinOpen?: (isRecycleBinOpen: boolean) => void;
  filterOptions?: {
    id: number | string;
    title: string;
  }[];
};

export default function SuperAdminLayoutContentWrapperDesktop(props: Props) {
  const {
    children,
    title,
    titleSuffixComponent,
    hasRecycleBin,
    hasAddButton,
    addButtonText,
    addButtonPath,
    hasFilterButton,
    hasPagination,
    totalPages,
    apiUrl,
    isRecycleBinOpen,
    setIsRecycleBinOpen,
    filterOptions,
  } = props;

  const [currentPage, setCurrentPage] = useState(1);
  const [count, setCount] = useState(0);
  const [isFilterOpen, setFilterIsOpen] = useState(false);

  const [refresh] = useAtom(refreshTable);

  useEffect(() => {
    if (apiUrl) {
      apiClient
        .get<{
          data: { id: number }[];
          meta: { pagination: { total: number } };
        }>(`${apiUrl}?filters[removedAt][$null]=false`, {
          headers: {
            Authorization: `Bearer ${STRAPI_TOKEN}`,
          },
        })
        .then((res) => {
          setCount((res as any)?.meta?.pagination?.total);
        });
    }
  }, [apiUrl, refresh]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl text-[#202224]">
            {isRecycleBinOpen ? "زباله‌دان" : title}
          </span>

          {titleSuffixComponent}
        </div>

        <div className="flex items-center gap-3">
          {hasRecycleBin && (
            <RecycleBinButton
              count={count}
              isRecycleBinOpen={isRecycleBinOpen}
              setIsRecycleBinOpen={setIsRecycleBinOpen}
            />
          )}

          {hasAddButton && (
            <AddButton text={addButtonText ?? ""} path={addButtonPath ?? "#"} />
          )}

          {hasFilterButton && (
            <FilterButton
              isFilterOpen={isFilterOpen}
              setFilterIsOpen={setFilterIsOpen}
              options={filterOptions || []}
            />
          )}
        </div>
      </div>
      <div className="card mt-3 p-7">{children}</div>
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
