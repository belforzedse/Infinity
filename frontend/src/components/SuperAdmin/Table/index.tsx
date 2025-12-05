"use client";

import type { ColumnDef, SortingState, Row } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
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
import { apiCache } from "@/lib/api-cache";
import { AnimatePresence } from "framer-motion";
import { AnimatedTableRow } from "./AnimatedTableRow";

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
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [refresh, setRefresh] = useAtom(refreshTable);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
  const previousDataRef = useRef<TData[]>([]);
  const animationContextRef = useRef<string | null>(null);
  const newRowsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pageTransitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isFetchingRef = useRef(false);
  const fetchSeqRef = useRef(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fetchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const isPageVisibleRef = useRef(true);
  const lastPageRef = useRef(page);

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

  // Helper function to resolve row keys consistently
  const resolveRowKey = useCallback(
    (rowData: TData | undefined) => {
      const key = getRowId?.(rowData as TData) ?? (rowData as any)?.id ?? "";
      return String(key);
    },
    [getRowId],
  );

  const clearNewRowsTimeout = useCallback(() => {
    if (newRowsTimeoutRef.current) {
      clearTimeout(newRowsTimeoutRef.current);
      newRowsTimeoutRef.current = null;
    }
  }, []);

  const updateAnimationState = useCallback(
    (nextData: TData[], contextKey: string) => {
      const previousContext = animationContextRef.current;
      const contextChanged = previousContext !== contextKey;

      // Reset animation tracking when context (url/page/filter) changes or on first load
      if (contextChanged || !hasLoadedOnce) {
        clearNewRowsTimeout();
        if (contextChanged) {
          setNewlyAddedIds(new Set());
        }
        animationContextRef.current = contextKey;
        previousDataRef.current = nextData;
        return;
      }

      const previousIds = new Set(previousDataRef.current.map((item) => resolveRowKey(item)));
      const addedIds = nextData
        .map((item) => resolveRowKey(item))
        .filter((id) => id && !previousIds.has(id));

      if (addedIds.length > 0) {
        setNewlyAddedIds(new Set(addedIds));
        clearNewRowsTimeout();
        newRowsTimeoutRef.current = setTimeout(() => setNewlyAddedIds(new Set()), 700);
      }

      animationContextRef.current = contextKey;
      previousDataRef.current = nextData;
    },
    [clearNewRowsTimeout, hasLoadedOnce, resolveRowKey],
  );

  const runFetch = useCallback(
    async (
      apiUrl: string,
      { force = false, silent = false }: { force?: boolean; silent?: boolean } = {},
    ) => {
      const useSilent = silent && hasLoadedOnce;

      // Avoid duplicate fetch for identical URL unless forced
      if (!force && lastUrlRef.current === apiUrl) return;
      lastUrlRef.current = apiUrl;
      if (isFetchingRef.current) return;

      // When forcing refresh, clear cache for this specific URL pattern
      if (force) {
        apiCache.clearByPattern(new RegExp(apiUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
      }

      const seq = ++fetchSeqRef.current;
      isFetchingRef.current = true;
      if (!useSilent) {
        setInternalLoading(true);
      }
      try {
        // When forcing refresh, bypass cache to get fresh data
        const res = await apiClient.get<TData[]>(apiUrl, {
          cache: force ? "no-store" : "default",
        });

        if (seq === fetchSeqRef.current) {
          const payload = Array.isArray(res) ? res : (res as any)?.data;
          const newData = (payload as TData[]) ?? [];
          const contextKey = apiUrl || "local-data";

          updateAnimationState(newData, contextKey);
          setTableData(newData);
          setHasLoadedOnce(true);

          if (isPageTransitioning) {
            if (pageTransitionTimeoutRef.current) {
              clearTimeout(pageTransitionTimeoutRef.current);
            }
            pageTransitionTimeoutRef.current = setTimeout(() => {
              setIsPageTransitioning(false);
            }, 320);
          }

          const total =
            (res as any)?.meta?.pagination?.total ??
            (Array.isArray(payload) ? payload.length : 0) ??
            0;

          setTotalSize(total);
        }
      } catch (error) {
        if ((error as any)?.name !== "AbortError" && process.env.NODE_ENV === "development") {
          console.error("Failed to fetch table data:", error);
        }
      } finally {
        if (seq === fetchSeqRef.current) {
          if (!useSilent) {
            setInternalLoading(false);
          }
          isFetchingRef.current = false;
        }
      }
    },
    [setTotalSize, hasLoadedOnce, updateAnimationState, isPageTransitioning],
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
      runFetch(requestUrl, { force: true, silent: true });
      setRefresh(false);
    }
  }, [refresh, requestUrl, runFetch, setRefresh]);

  // Set up visibility change listener for page focus - refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
      // Refresh data when page becomes visible (switched back from another tab)
      if (!document.hidden && requestUrl) {
        // Silent refresh to avoid visual skeleton; animations will handle diffs
        runFetch(requestUrl, { force: true, silent: true });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [requestUrl, runFetch]);

  // Track page transitions to swap animation style (fade only on page change)
  useEffect(() => {
    if (lastPageRef.current !== page) {
      setIsPageTransitioning(true);
      lastPageRef.current = page;
    }
  }, [page]);

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
      const safeData = data ?? [];
      const contextKey = requestUrl ?? "local-data";
      updateAnimationState(safeData, contextKey);
      setTableData(safeData);
      setHasLoadedOnce(true);
    }
  }, [data, requestUrl, updateAnimationState]);

  useEffect(() => {
    return () => {
      clearNewRowsTimeout();
      if (pageTransitionTimeoutRef.current) {
        clearTimeout(pageTransitionTimeoutRef.current);
      }
    };
  }, [clearNewRowsTimeout]);

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
  const showSkeleton = isLoading && (isPageTransitioning || !hasLoadedOnce);

  return (
    <div className="w-full">
      {/* Mobile header controls */}
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
                      tableData.forEach((row) => next.add(resolveRowKey(row)));
                    }
                    setSelectedIds(next);
                  }}
                />
                <span className="text-foreground-primary text-xs">انتخاب همه</span>
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
                    const rows = tableData.filter((r) => selectedIds.has(resolveRowKey(r)));
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

      {/* Desktop table */}
      <div className="hidden w-full overflow-x-auto overflow-y-clip md:block">
        <div className="relative">
          <table className={cn("w-full caption-bottom text-sm", className)}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr className="rounded-2xl bg-slate-50" key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        className={twMerge(
                          "text-foreground-primary h-12 px-2 text-right align-middle text-sm font-normal md:px-3 lg:px-4",
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
                              tableData.forEach((row) => next.add(resolveRowKey(row)));
                            }
                            setSelectedIds(next);
                          }}
                        />
                        <span className="text-foreground-primary text-xs">انتخاب همه</span>
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
                            const rows = tableData.filter((r) => selectedIds.has(resolveRowKey(r)));
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
              {showSkeleton ? (
                <ReportTableSkeleton columns={columns.length} />
              ) : table.getRowModel().rows?.length ? (
                <AnimatePresence mode="popLayout" initial={false}>
                  {table.getRowModel().rows.map((row) => {
                    const resolvedKey = resolveRowKey(row.original as TData);
                  const rowKey = resolvedKey || String(row.id); // fallback avoids empty/unstable keys
                  const isNew = rowKey ? newlyAddedIds.has(rowKey) : false;

                  return (
                    <AnimatedTableRow
                      key={rowKey}
                      rowKey={rowKey}
                      isNew={isNew}
                      isPageTransitioning={isPageTransitioning}
                      draggable={draggable}
                      onDragStart={() => handleDragStart(row)}
                        onDragOver={(e) => handleDragOver(e, row)}
                        onDrop={(e) => handleDrop(e, row)}
                        className={twMerge(
                          // IMPORTANT: avoid `transition-all` (conflicts with Framer transforms)
                          "border-b border-gray-200 transition-colors hover:bg-gray-50/50",
                          // IMPORTANT: outline doesn't affect layout height
                          dragOverRow?.id === row.id &&
                            "outline outline-2 -outline-offset-2 outline-blue-500",
                        )}
                      >
                        {row.getVisibleCells().map((cell, index) => (
                          <td
                            key={cell.id}
                            className={twMerge(
                              "p-2 text-right align-middle md:p-3 lg:p-4 [&:has([role=checkbox])]:pr-0",
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
                                  checked={selectedIds.has(rowKey)}
                                  onChange={(e) => {
                                    const next = new Set(selectedIds);
                                    if (e.target.checked) next.add(rowKey);
                                    else next.delete(rowKey);
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
                      </AnimatedTableRow>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-sm text-neutral-500"
                  >
                    داده‌ای برای نمایش وجود ندارد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards/table alternative */}
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
