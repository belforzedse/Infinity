"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  Row,
} from "@tanstack/react-table";
// removed unused import: getPaginationRowModel from "@tanstack/react-table"
import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/tailwind";
import { twMerge } from "tailwind-merge";
import SuperAdminTableSelect from "./Select";
import DragIcon from "../Layout/Icons/DragIcon";
import { apiClient } from "@/services";
import { atom, useAtom } from "jotai";
import { STRAPI_TOKEN } from "@/constants/api";
import { useQueryState } from "nuqs";
import ReportTableSkeleton from "@/components/Skeletons/ReportTableSkeleton";

declare module "@tanstack/table-core" {
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
    __?: Record<string, TValue>;
    ___?: Record<string, TData>;
  }
}

interface TableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data?: TData[];
  url?: string;
  removeActions?: boolean;
  className?: string;
  draggable?: boolean;
  mobileTable?: (data: TData[] | undefined) => React.ReactNode;
  onItemDrag?: (row: Row<TData>) => void;
}

type Response<TData> = {
  data: TData[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
};

type FilterItem = {
  field: string;
  operator: string;
  value: string | number | boolean;
};

export const refreshTable = atom(true);
export function SuperAdminTable<TData, TValue>({
  columns,
  data,
  url,
  className,
  removeActions,
  draggable,
  onItemDrag,
  mobileTable,
}: TableProps<TData, TValue>) {
  const [filter] = useQueryState("filter", {
    defaultValue: [],
    parse: (value) => JSON.parse(decodeURIComponent(value || "[]")),
    serialize: (value) => encodeURIComponent(JSON.stringify(value || [])),
  });

  const [, setTotalSize] = useQueryState("totalSize", {
    defaultValue: 0,
    parse: (value) => parseInt(value || "0"),
    serialize: (value) => value.toString(),
  });

  const [page] = useQueryState("page", { defaultValue: "1" });
  const [pageSize] = useQueryState("pageSize", {
    defaultValue: "25",
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [tableData, setTableData] = useState(data);
  const [draggedRow, setDraggedRow] = useState<Row<TData> | null>(null);
  const [dragOverRow, setDragOverRow] = useState<Row<TData> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refresh, setRefresh] = useAtom(refreshTable);

  const isFetchingRef = useRef(false);
  const lastFilter = useRef(filter);

  useEffect(() => {
    if (url && (!isLoading || refresh)) {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      setRefresh(false);
      setIsLoading(true);

      // Build the query parameters for Strapi
      let apiUrl = url;
      const hasQueryParams = url.includes("?");
      let separator = hasQueryParams ? "&" : "?";

      // Add pagination parameters
      apiUrl = `${apiUrl}${separator}pagination[page]=${page}&pagination[pageSize]=${pageSize}`;

      // Update separator for subsequent parameters
      separator = "&";

      // Add filters if they exist
      if (Array.isArray(filter) && filter.length > 0) {
        const filters = filter as unknown as FilterItem[];
        const filterParams = filters
          .map((item) => {
            const { field, operator, value } = item || ({} as FilterItem);
            if (!field || !operator || value === undefined || value === null)
              return "";
            return `filters${field}[${operator}]=${encodeURIComponent(String(value))}`;
          })
          .filter((param) => param !== "")
          .join("&");

        if (filterParams) {
          apiUrl = `${apiUrl}${separator}${filterParams}`;
        }
      }

      apiClient
        .get<Response<TData>>(apiUrl, {
          headers: {
            Authorization: `Bearer ${STRAPI_TOKEN}`,
          },
        })
        .then((res: Response<TData>) => {
          setTableData(res.data);
          setTotalSize(res.meta?.pagination?.total ?? 0);
          setIsLoading(false);
          isFetchingRef.current = false;
        })
        .catch((error) => {
          console.error("Failed to fetch table data:", error);
          setIsLoading(false);
          isFetchingRef.current = false;
        });
    }
  }, [url, refresh, page, pageSize]);

  useEffect(() => {
    if (!refresh) {
      if (isFetchingRef.current) return;
      if (JSON.stringify(lastFilter.current) === JSON.stringify(filter)) return;

      lastFilter.current = filter;

      setRefresh(true);
    }
  }, [url, refresh, filter]);

  const table = useReactTable({
    data: tableData || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  const handleDragStart = (row: Row<TData>) => {
    setDraggedRow(row);
  };

  const handleDragOver = (e: React.DragEvent, row: Row<TData>) => {
    e.preventDefault();
    setDragOverRow(row);
  };

  const handleDrop = (e: React.DragEvent, targetRow: Row<TData>) => {
    e.preventDefault();
    if (!draggedRow || !tableData) return;

    const newData = [...tableData];
    const draggedRowIndex = draggedRow.index;
    const targetRowIndex = targetRow.index;

    // Swap positions
    [newData[draggedRowIndex], newData[targetRowIndex]] = [
      newData[targetRowIndex],
      newData[draggedRowIndex],
    ];

    setTableData(newData);
    setDraggedRow(null);
    setDragOverRow(null);
    onItemDrag?.(targetRow);
  };

  return (
    <div className="w-full">
      <div className="block md:hidden">
        <div className="flex flex-col gap-2">
          {!removeActions && (
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <input type="checkbox" />
                <span className="text-xs text-foreground-primary">
                  انتخاب همه
                </span>
              </div>

              <div className="flex items-center gap-2">
                <SuperAdminTableSelect
                  options={[
                    { id: "0", title: "اقدام دسته جمعی" },
                    { id: "1", title: "کاربر" },
                    { id: "2", title: "ادمین" },
                  ]}
                />

                <button className="flex items-center justify-between rounded-lg bg-actions-primary px-3 py-2 text-white">
                  اجرا
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="hidden w-full overflow-auto md:block">
        <table className={cn("text-sm w-full caption-bottom", className)}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr className="rounded-2xl bg-slate-50" key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      className={twMerge(
                        "text-sm h-12 px-4 text-right align-middle font-normal text-foreground-primary",
                        header.column.columnDef.meta?.headerClassName,
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  );
                })}
              </tr>
            ))}
            {!removeActions && (
              <tr>
                <td colSpan={columns.length}>
                  <div className="my-3 flex h-auto w-full items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" />
                      <span className="text-xs text-foreground-primary">
                        انتخاب همه
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <SuperAdminTableSelect
                        options={[
                          { id: "0", title: "اقدام دسته جمعی" },
                          { id: "1", title: "کاربر" },
                          { id: "2", title: "ادمین" },
                        ]}
                      />

                      <button className="flex items-center justify-between rounded-lg bg-actions-primary px-3 py-2 text-white">
                        اجرا
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </thead>
          <tbody>
            {isLoading ? (
              <ReportTableSkeleton columns={columns.length} />
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  draggable={draggable}
                  onDragStart={() => handleDragStart(row)}
                  onDragOver={(e) => handleDragOver(e, row)}
                  onDrop={(e) => handleDrop(e, row)}
                  className={twMerge(
                    "border-b border-gray-200 transition-colors hover:bg-gray-50/50",
                    dragOverRow?.id === row.id && "border-t-2 border-blue-500",
                  )}
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <td
                      key={cell.id}
                      className={twMerge(
                        "p-4 text-right align-middle [&:has([role=checkbox])]:pr-0",
                        cell.column.columnDef.meta?.cellClassName,
                      )}
                    >
                      {index === 0 && !removeActions ? (
                        <div className="flex items-center gap-2">
                          {draggable && (
                            <div className="cursor-move">
                              <DragIcon />
                            </div>
                          )}
                          <input type="checkbox" />
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </div>
                      ) : (
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mobileTable && (
        <div className="block md:hidden">{mobileTable(tableData)}</div>
      )}
    </div>
  );
}
