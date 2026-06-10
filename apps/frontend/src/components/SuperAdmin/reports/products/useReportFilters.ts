"use client";

import { useCallback, useMemo } from "react";
import { useQueryState } from "nuqs";
import type { ProductReportFilters } from "@/services/super-admin/reports/products";

const DAY_MS = 86_400_000;

function toDateOnly(d: Date): string {
  // yyyy-mm-dd in the local calendar (kept simple; backend bucketing handles tz).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DEFAULT_START = toDateOnly(new Date(Date.now() - 30 * DAY_MS));
const DEFAULT_END = toDateOnly(new Date());

export type ReportTab = "overview" | "trends" | "performance" | "inventory";

/**
 * Centralizes the report workspace URL state (shareable, back/forward safe).
 * Every tab and the filter bar read the same nuqs keys, so the URL is the single
 * source of truth for the selected period and filters.
 */
export function useReportFilters() {
  const [start, setStart] = useQueryState("start", { defaultValue: DEFAULT_START });
  const [end, setEnd] = useQueryState("end", { defaultValue: DEFAULT_END });
  const [tab, setTab] = useQueryState("tab", { defaultValue: "overview" });
  const [q, setQ] = useQueryState("q", { defaultValue: "" });
  const [cat, setCat] = useQueryState("cat", { defaultValue: "" });
  const [ptype, setPtype] = useQueryState("ptype", { defaultValue: "" });
  const [stock, setStock] = useQueryState("stock", { defaultValue: "" });
  const [, setPage] = useQueryState("page", { defaultValue: "1" });

  // Changing a filter resets paging to the first page.
  const resetPage = useCallback(() => setPage("1"), [setPage]);

  const filters: ProductReportFilters = useMemo(
    () => ({
      start,
      end,
      q: q || undefined,
      categoryId: cat ? Number(cat) : "",
      productType: (ptype as ProductReportFilters["productType"]) || "",
      stockStatus: (stock as ProductReportFilters["stockStatus"]) || "",
    }),
    [start, end, q, cat, ptype, stock],
  );

  return {
    start,
    end,
    tab: (tab as ReportTab) || "overview",
    q,
    cat,
    ptype,
    stock,
    filters,
    setStart: (v: string) => {
      setStart(v);
      resetPage();
    },
    setEnd: (v: string) => {
      setEnd(v);
      resetPage();
    },
    setTab: (v: ReportTab) => setTab(v),
    setQ: (v: string) => {
      setQ(v || null);
      resetPage();
    },
    setCat: (v: string) => {
      setCat(v || null);
      resetPage();
    },
    setPtype: (v: string) => {
      setPtype(v || null);
      resetPage();
    },
    setStock: (v: string) => {
      setStock(v || null);
      resetPage();
    },
  };
}
