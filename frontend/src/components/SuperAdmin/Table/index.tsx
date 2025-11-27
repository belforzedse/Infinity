"use client";

import type {
  ColumnDef,
  SortingState,
  Row} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel
} from "@tanstack/react-table";
// removed unused import: getPaginationRowModel from "@tanstack/react-table"
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/utils/tailwind";
import { twMerge } from "tailwind-merge";
import SuperAdminTableSelect from "./Select";
import DragIcon from "../Layout/Icons/DragIcon";
import { apiClient } from "@/services";
import { atom, useAtom } from "jotai";
import { useQueryState } from "nuqs";
import ReportTableSkeleton from "@/components/Skeletons/ReportTableSkeleton";
import { optimisticallyDeletedItems } from "@/lib/atoms/optimisticDelete";

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
  loading?: boolean;
  _removeActions?: boolean;
  className?: string;
  draggable?: boolean;
  mobileTable?: (
    data: TData[] | undefined,
    selectionProps?: {
      enableSelection: boolean;
      selectedIds: Set<string>;
      onSelectionChange: (id: string, selected: boolean) => void;
    },
  ) => React.ReactNode;
  onItemDrag?: (row: Row<TData>) => void;
  // Enable row selection + bulk actions
  enableSelection?: boolean;
  getRowId?: (row: TData) => string;
  bulkOptions?: { id: string; title: string }[];
  onBulkAction?: (actionId: string, selectedRows: TData[]) => void | Promise<void>;
  // Optional client-side sorting when API sort is not feasible
  clientSort?:
    | undefined
    | {
        key: string;
        direction: "asc" | "desc";
        getValue: (row: TData) => number;
      };
}

// Strapi-like response meta is returned by our ApiClient as ApiResponse<T>

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
  loading,
  className,
  _removeActions,
  draggable,
  onItemDrag,
  mobileTable,
  enableSelection,
  getRowId,
  bulkOptions,
  onBulkAction,
  clientSort,
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");
  const [draggedRow, setDraggedRow] = useState<Row<TData> | null>(null);
  const [dragOverRow, setDragOverRow] = useState<Row<TData> | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [refresh, setRefresh] = useAtom(refreshTable);
  const [deletedItems] = useAtom(optimisticallyDeletedItems);

  const isFetchingRef = useRef(false);
  const fetchSeqRef = useRef(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fetchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const isPageVisibleRef = useRef(true);

  const requestUrl = useMemo(() => {
    if (!url) return null;
    let apiUrl = url;
    const hasQueryParams = url.includes("?");
    let separator = hasQueryParams ? "&" : "?";

    apiUrl = `${apiUrl}${separator}pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
    separator = "&";

    if (Array.isArray(filter) && filter.length > 0) {
      const filters = filter as unknown as FilterItem[];
      const filterParams = filters
        .map((item) => {
          const { field, operator, value } = item || ({} as FilterItem);
          if (!field || !operator || value === undefined || value === null) return "";
          return `filters${field}[${operator}]=${encodeURIComponent(String(value))}`;
        })
        .filter(Boolean)
        .join("&");
      if (filterParams) apiUrl = `${apiUrl}${separator}${filterParams}`;
    }

    return apiUrl;
  }, [url, page, pageSize, filter]);

  const lastUrlRef = useRef<string | null>(null);

  const runFetch = useCallback(
    async (apiUrl: string, { force = false }: { force?: boolean } = {}) => {
      // Avoid duplicate fetch for identical URL unless forced
      if (!force && lastUrlRef.current === apiUrl) return;
      lastUrlRef.current = apiUrl;
      if (isFetchingRef.current) return;

      const seq = ++fetchSeqRef.current;
      isFetchingRef.current = true;
      setInternalLoading(true);
      try {
        const res = await apiClient.get<TData[]>(apiUrl);
        if (seq === fetchSeqRef.current) {
          const payload = Array.isArray(res) ? res : res?.data;
          setTableData((payload as TData[]) ?? []);
          const total =
            (res as any)?.meta?.pagination?.total ??
            (Array.isArray(payload) ? payload.length : 0) ??
            0;
          setTotalSize(total);
        }
      } catch (error) {
        if ((error as any)?.name !== "AbortError") {
          console.error("Failed to fetch table data:", error);
        }
      } finally {
        if (seq === fetchSeqRef.current) {
          setInternalLoading(false);
          isFetchingRef.current = false;
        }
      }
    },
    [setTotalSize],
  );

  // Fetch on first mount and when the computed request URL changes
  useEffect(() => {
    if (!requestUrl) return;

    if (fetchDebounceRef.current) {
      clearTimeout(fetchDebounceRef.current);
    }

    fetchDebounceRef.current = setTimeout(() => {
      runFetch(requestUrl);
      fetchDebounceRef.current = null;
    }, 300);

    return () => {
      if (fetchDebounceRef.current) {
        clearTimeout(fetchDebounceRef.current);
        fetchDebounceRef.current = null;
      }
    };
  }, [requestUrl, runFetch]);

  // External refresh trigger (e.g. after mutations)
  useEffect(() => {
    if (refresh && requestUrl) {
      runFetch(requestUrl, { force: true });
      setRefresh(false);
    }
  }, [refresh, requestUrl, runFetch, setRefresh]);

  // Set up visibility change listener for page focus - refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
      // Refresh data when page becomes visible (switched back from another tab)
      if (!document.hidden && requestUrl) {
        runFetch(requestUrl, { force: true });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [requestUrl, runFetch]);

  // Note: Automatic polling has been disabled on super admin pages to prevent
  // conflicts when admins are editing data. Data will update on manual refresh or
  // after mutations (e.g., item deletion, status change).
  // Users can manually refresh the page to see the latest data.
  useEffect(() => {
    // Polling disabled - admins should manually refresh to get latest data
    // This prevents the table from updating while an admin is in the middle of editing
    return () => {
      // Cleanup placeholder
    };
  }, []);

  // Keep internal data in sync when data prop is provided (non-URL usage)
  useEffect(() => {
    if (data !== undefined) {
      setTableData(data);
    }
  }, [data]);

  const table = useReactTable({
    data: useMemo(() => {
      if (!tableData) return [] as TData[];
      if (!clientSort) return tableData;
      const factor = clientSort.direction === "asc" ? 1 : -1;
      return [...tableData].sort((a, b) => {
        const va = Number(clientSort.getValue(a) ?? 0);
        const vb = Number(clientSort.getValue(b) ?? 0);
        if (va === vb) return 0;
        return va > vb ? factor : -1 * factor;
      });
    }, [tableData, clientSort]) as TData[],
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

  const isLoading = loading ?? internalLoading;

  return (
    <div className="w-full">
      <div className="block md:hidden">
        <div className="flex flex-col gap-2">
          {enableSelection && (
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    !!tableData && selectedIds.size > 0 && selectedIds.size === tableData.length
                  }
                  onChange={(e) => {
                    if (!tableData) return;
                    const next = new Set<string>();
                    if (e.target.checked) {
                      tableData.forEach((row) =>
                        next.add((getRowId?.(row) || String((row as any)?.id)) ?? ""),
                      );
                    }
                    setSelectedIds(next);
                  }}
                />
                <span className="text-xs text-foreground-primary">انتخاب همه</span>
              </div>

              <div className="flex items-center gap-2">
                <SuperAdminTableSelect
                  selectedOption={bulkAction}
                  onOptionSelect={(id) => setBulkAction(String(id))}
                  options={[{ id: "", title: "اقدام دسته جمعی" }, ...(bulkOptions || [])]}
                />

                <button
                  onClick={() => {
                    if (!onBulkAction || !tableData || !bulkAction) return;
                    const rows = tableData.filter((r) =>
                      selectedIds.has((getRowId?.(r) || String((r as any)?.id)) ?? ""),
                    );
                    onBulkAction(bulkAction, rows);
                  }}
                  className="flex items-center justify-between rounded-lg bg-actions-primary px-3 py-2 text-white"
                >
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
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
            {enableSelection && (
              <tr>
                <td colSpan={columns.length}>
                  <div className="my-3 flex h-auto w-full items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          !!tableData &&
                          selectedIds.size > 0 &&
                          selectedIds.size === tableData.length
                        }
                        onChange={(e) => {
                          if (!tableData) return;
                          const next = new Set<string>();
                          if (e.target.checked) {
                            tableData.forEach((row) =>
                              next.add((getRowId?.(row) || String((row as any)?.id)) ?? ""),
                            );
                          }
                          setSelectedIds(next);
                        }}
                      />
                      <span className="text-xs text-foreground-primary">انتخاب همه</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <SuperAdminTableSelect
                        selectedOption={bulkAction}
                        onOptionSelect={(id) => setBulkAction(String(id))}
                        options={[{ id: "", title: "اقدام دسته جمعی" }, ...(bulkOptions || [])]}
                      />

                      <button
                        onClick={() => {
                          if (!onBulkAction || !tableData || !bulkAction) return;
                          const rows = tableData.filter((r) =>
                            selectedIds.has((getRowId?.(r) || String((r as any)?.id)) ?? ""),
                          );
                          onBulkAction(bulkAction, rows);
                        }}
                        className="flex items-center justify-between rounded-lg bg-actions-primary px-3 py-2 text-white"
                      >
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
              table.getRowModel().rows.map((row) => {
                const isOptimisticallyDeleted = deletedItems.has(
                  (getRowId?.(row.original as TData) ||
                    String((row.original as any)?.id)) ?? ""
                );

                return (
                  <tr
                    key={row.id}
                    draggable={draggable}
                    onDragStart={() => handleDragStart(row)}
                    onDragOver={(e) => handleDragOver(e, row)}
                    onDrop={(e) => handleDrop(e, row)}
                    className={twMerge(
                      "border-b border-gray-200 transition-all duration-300 ease-out hover:bg-gray-50/50",
                      dragOverRow?.id === row.id && "border-t-2 border-blue-500",
                      isOptimisticallyDeleted && "opacity-30 grayscale",
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
                        {index === 0 && enableSelection ? (
                          <div className="flex items-center gap-2">
                            {draggable && (
                              <div className="cursor-move">
                                <DragIcon />
                              </div>
                            )}
                            <input
                              type="checkbox"
                              checked={selectedIds.has(
                                (getRowId?.(row.original as TData) ||
                                  String((row.original as any)?.id)) ??
                                  "",
                              )}
                              onChange={(e) => {
                                const id =
                                  (getRowId?.(row.original as TData) ||
                                    String((row.original as any)?.id)) ??
                                  "";
                                const next = new Set(selectedIds);
                                if (e.target.checked) next.add(id);
                                else next.delete(id);
                                setSelectedIds(next);
                              }}
                            />
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        ) : (
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-sm text-neutral-500">
                  داده‌ای برای نمایش وجود ندارد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mobileTable && (
        <div className="block md:hidden">
          {mobileTable(
            tableData,
            enableSelection
              ? {
                  enableSelection: true,
                  selectedIds,
                  onSelectionChange: (id: string, selected: boolean) => {
                    const next = new Set(selectedIds);
                    if (selected) next.add(id);
                    else next.delete(id);
                    setSelectedIds(next);
                  },
                }
              : undefined,
          )}
        </div>
      )}
    </div>
  );
}
