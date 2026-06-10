import { apiClient } from "@/services";
import { formatQueryParams } from "@/utils/api";
import { API_BASE_URL } from "@/constants/api";
import type {
  ProductOverview,
  ProductTrends,
  ProductPerformanceResult,
  ProductDetail,
  ProductInventory,
  ProductReportFilters,
  TrendGrouping,
} from "./types";

export * from "./types";

const BASE = "/reports/products";

/** Build the filter query object the backend understands (omitting empty values). */
function filterParams(filters: ProductReportFilters): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (filters.start) out.start = filters.start;
  if (filters.end) out.end = filters.end;
  if (filters.q) out.q = filters.q;
  if (filters.productType) out.productType = filters.productType;
  if (filters.categoryId) out.categoryId = filters.categoryId;
  if (filters.stockStatus) out.stockStatus = filters.stockStatus;
  return out;
}

export async function getProductOverview(params: {
  start?: string;
  end?: string;
}): Promise<ProductOverview> {
  const res = await apiClient.get(`${BASE}/overview${formatQueryParams(params as any)}`, {
    cache: "no-store",
  });
  return (res as any).data as ProductOverview;
}

export async function getProductTrends(params: {
  start?: string;
  end?: string;
  grouping?: TrendGrouping;
}): Promise<ProductTrends> {
  const res = await apiClient.get(`${BASE}/trends${formatQueryParams(params as any)}`, {
    cache: "no-store",
  });
  return (res as any).data as ProductTrends;
}

/**
 * The base URL passed to <SuperAdminTable url=...>. The table appends
 * `pagination[page]` / `pagination[pageSize]`, so this carries only filters + sort.
 */
export function buildPerformanceUrl(
  filters: ProductReportFilters,
  sort?: { key: string; direction: "asc" | "desc" },
): string {
  const params = filterParams(filters);
  if (sort) params.sort = `${sort.key}:${sort.direction}`;
  return `${BASE}/performance${formatQueryParams(params as any)}`;
}

export async function getProductPerformance(
  filters: ProductReportFilters,
  opts: {
    page?: number;
    pageSize?: number;
    sort?: { key: string; direction: "asc" | "desc" };
  } = {},
): Promise<ProductPerformanceResult> {
  const params: Record<string, string | number> = {
    ...filterParams(filters),
    "pagination[page]": opts.page ?? 1,
    "pagination[pageSize]": opts.pageSize ?? 25,
  };
  if (opts.sort) params.sort = `${opts.sort.key}:${opts.sort.direction}`;
  const res = await apiClient.get(`${BASE}/performance${formatQueryParams(params as any)}`, {
    cache: "no-store",
  });
  return res as ProductPerformanceResult;
}

export async function getProductDetail(params: {
  productId: number;
  start?: string;
  end?: string;
  grouping?: TrendGrouping;
}): Promise<ProductDetail> {
  const res = await apiClient.get(`${BASE}/detail${formatQueryParams(params as any)}`, {
    cache: "no-store",
  });
  return (res as any).data as ProductDetail;
}

export async function getProductInventory(params: {
  start?: string;
  end?: string;
  limit?: number;
}): Promise<ProductInventory> {
  const res = await apiClient.get(`${BASE}/inventory${formatQueryParams(params as any)}`, {
    cache: "no-store",
  });
  return (res as any).data as ProductInventory;
}

/**
 * Download the performance report as CSV. Uses an authorized fetch + blob (the
 * export endpoint is protected, so a plain anchor can't carry the JWT). The CSV
 * is produced by the SAME backend query + filters as the visible table.
 */
export async function downloadProductReportCsv(
  filters: ProductReportFilters,
  sort?: { key: string; direction: "asc" | "desc" },
): Promise<void> {
  if (typeof window === "undefined") return;
  const params = filterParams(filters);
  if (sort) params.sort = `${sort.key}:${sort.direction}`;
  const url = `${API_BASE_URL}${BASE}/export${formatQueryParams(params as any)}`;
  const token = localStorage.getItem("accessToken");
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = `product-report-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}
