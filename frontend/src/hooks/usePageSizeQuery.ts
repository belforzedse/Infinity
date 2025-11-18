"use client";

import { useQueryState } from "nuqs";

export const PAGE_SIZE_OPTIONS = [
  { id: 25, title: "نمایش ۲۵ رکورد" },
  { id: 10, title: "نمایش ۱۰ رکورد" },
  { id: 50, title: "نمایش ۵۰ رکورد" },
  { id: 100, title: "نمایش ۱۰۰ رکورد" },
];

export default function usePageSizeQuery() {
  const [pageSize, setPageSize] = useQueryState("pageSize", { defaultValue: "25" });
  const [, setPage] = useQueryState("page", { defaultValue: "1" });

  const updatePageSize = async (size: number | string) => {
    await setPageSize(size.toString());
    await setPage("1");
  };

  return {
    pageSize,
    updatePageSize,
  };
}
