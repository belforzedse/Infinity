"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useQueryState } from "nuqs";
import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import SuperAdminPagination from "@/components/SuperAdmin/Pagination";
import { useReportFilters } from "./useReportFilters";
import ProductDrawer from "./ProductDrawer";
import { faNum } from "@/utils/faNum";
import { priceFormatter } from "@/utils/price";
import resolveAssetUrl from "@/utils/resolveAssetUrl";
import {
  buildPerformanceUrl,
  downloadProductReportCsv,
  type ProductPerformanceRow,
} from "@/services/super-admin/reports/products";

const STATUS_FA: Record<string, string> = {
  in: "موجود",
  low: "کم",
  out: "ناموجود",
  unknown: "نامشخص",
};
const STATUS_TONE: Record<string, string> = {
  in: "bg-green-50 text-green-600",
  low: "bg-amber-50 text-amber-600",
  out: "bg-red-50 text-red-600",
  unknown: "bg-neutral-100 text-neutral-500",
};

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "gross:desc", label: "بیشترین فروش ناخالص" },
  { value: "net:desc", label: "بیشترین خالص فروش" },
  { value: "units:desc", label: "بیشترین تعداد" },
  { value: "orders:desc", label: "بیشترین سفارش" },
  { value: "refunds:desc", label: "بیشترین مرجوعی" },
  { value: "stock:asc", label: "کمترین موجودی" },
  { value: "title:asc", label: "نام (الفبا)" },
];

const ALL_COLUMNS = [
  "image",
  "title",
  "type",
  "category",
  "units",
  "gross",
  "net",
  "discounts",
  "refunds",
  "orders",
  "avgPrice",
  "stock",
] as const;
type ColKey = (typeof ALL_COLUMNS)[number];
const COL_LABELS: Record<ColKey, string> = {
  image: "تصویر",
  title: "محصول",
  type: "نوع",
  category: "دسته",
  units: "تعداد",
  gross: "ناخالص",
  net: "خالص",
  discounts: "تخفیف",
  refunds: "مرجوعی",
  orders: "سفارش",
  avgPrice: "قیمت میانگین",
  stock: "موجودی",
};

export default function PerformanceTab() {
  const { filters, start, end } = useReportFilters();
  const [sort, setSort] = useQueryState("psort", { defaultValue: "gross:desc" });
  const [page] = useQueryState("page", { defaultValue: "1" });
  const [pageSize, setPageSize] = useQueryState("pageSize", { defaultValue: "25" });
  const [hidden, setHidden] = useState<Set<ColKey>>(new Set());
  const [drawerProductId, setDrawerProductId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showColMenu, setShowColMenu] = useState(false);

  const [sortKey, sortDir] = (sort || "gross:desc").split(":") as [string, "asc" | "desc"];

  const url = useMemo(
    () => buildPerformanceUrl(filters, { key: sortKey, direction: sortDir }),
    [filters, sortKey, sortDir],
  );

  const handleExport = async () => {
    try {
      setExporting(true);
      await downloadProductReportCsv(filters, { key: sortKey, direction: sortDir });
    } catch {
      // surfaced by alert to keep parity with existing export UX
      alert("خطا در دریافت خروجی CSV");
    } finally {
      setExporting(false);
    }
  };

  const columns = useMemo<ColumnDef<ProductPerformanceRow>[]>(() => {
    const defs: Record<ColKey, ColumnDef<ProductPerformanceRow>> = {
      image: {
        id: "image",
        header: COL_LABELS.image,
        cell: ({ row }) => {
          const src = row.original.imageUrl ? resolveAssetUrl(row.original.imageUrl) : "";
          return src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-neutral-100" />
          );
        },
      },
      title: {
        id: "title",
        header: COL_LABELS.title,
        cell: ({ row }) => (
          <button
            onClick={() => row.original.productId && setDrawerProductId(row.original.productId)}
            className="text-right font-medium text-neutral-800 hover:text-infinity-primary"
            disabled={!row.original.productId}
            title={row.original.productId ? "مشاهده جزئیات" : "محصول حذف‌شده"}
          >
            <span className="block max-w-[220px] truncate">{row.original.productTitle}</span>
            <span className="block font-mono text-xs text-neutral-400">
              {row.original.productSKU}
            </span>
          </button>
        ),
      },
      type: {
        id: "type",
        header: COL_LABELS.type,
        cell: ({ row }) =>
          row.original.productType === "Simple"
            ? "ساده"
            : row.original.productType === "Variable"
              ? "متغیر"
              : "—",
      },
      category: {
        id: "category",
        header: COL_LABELS.category,
        cell: ({ row }) => row.original.category || "—",
      },
      units: {
        id: "units",
        header: COL_LABELS.units,
        cell: ({ row }) => faNum(row.original.units),
      },
      gross: {
        id: "gross",
        header: COL_LABELS.gross,
        cell: ({ row }) => priceFormatter(row.original.gross, " ت"),
      },
      net: {
        id: "net",
        header: COL_LABELS.net,
        cell: ({ row }) => priceFormatter(row.original.net, " ت"),
      },
      discounts: {
        id: "discounts",
        header: COL_LABELS.discounts,
        cell: ({ row }) => priceFormatter(row.original.discounts, " ت"),
      },
      refunds: {
        id: "refunds",
        header: COL_LABELS.refunds,
        cell: ({ row }) => priceFormatter(row.original.refunds, " ت"),
      },
      orders: {
        id: "orders",
        header: COL_LABELS.orders,
        cell: ({ row }) => faNum(row.original.ordersCount),
      },
      avgPrice: {
        id: "avgPrice",
        header: COL_LABELS.avgPrice,
        cell: ({ row }) => priceFormatter(row.original.avgPrice, " ت"),
      },
      stock: {
        id: "stock",
        header: COL_LABELS.stock,
        cell: ({ row }) => (
          <span
            className={`rounded-md px-2 py-0.5 text-xs ${STATUS_TONE[row.original.stockStatus]}`}
          >
            {row.original.currentStock === null ? "—" : faNum(row.original.currentStock)} ·{" "}
            {STATUS_FA[row.original.stockStatus]}
          </span>
        ),
      },
    };
    return ALL_COLUMNS.filter((c) => !hidden.has(c)).map((c) => defs[c]);
  }, [hidden]);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-600">مرتب‌سازی:</label>
          <select
            className="h-10 rounded-lg border border-neutral-300 px-3 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowColMenu((s) => !s)}
              className="h-10 rounded-lg border border-neutral-300 px-3 text-sm text-neutral-700"
            >
              ستون‌ها
            </button>
            {showColMenu && (
              <div className="absolute left-0 z-10 mt-1 w-44 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg">
                {ALL_COLUMNS.map((c) => (
                  <label key={c} className="flex items-center gap-2 px-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      checked={!hidden.has(c)}
                      onChange={(e) => {
                        setHidden((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.delete(c);
                          else next.add(c);
                          return next;
                        });
                      }}
                    />
                    {COL_LABELS[c]}
                  </label>
                ))}
              </div>
            )}
          </div>
          <select
            className="h-10 rounded-lg border border-neutral-300 px-2 text-sm"
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value)}
          >
            {["25", "50", "100"].map((s) => (
              <option key={s} value={s}>
                {faNum(s)} ردیف
              </option>
            ))}
          </select>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="h-10 rounded-lg bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700 disabled:bg-neutral-400"
          >
            {exporting ? "در حال آماده‌سازی..." : "خروجی CSV"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-2 md:p-4">
        <SuperAdminTable<ProductPerformanceRow, unknown>
          _removeActions
          columns={columns}
          url={url}
          getRowId={(r) => String(r.productVariationId ?? r.productSKU)}
        />
      </div>

      <SuperAdminPagination currentPage={Number(page)} totalPages={1} onPageChange={() => {}} />

      {drawerProductId !== null && (
        <ProductDrawer
          productId={drawerProductId}
          start={start}
          end={end}
          onClose={() => setDrawerProductId(null)}
        />
      )}
    </div>
  );
}
