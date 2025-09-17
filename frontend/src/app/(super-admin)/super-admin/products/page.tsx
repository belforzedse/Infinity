"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, columns, Product } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { useCallback, useEffect, useState } from "react";
import { getProductSales } from "@/services/super-admin/reports/productSales";
import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";
import { useQueryState } from "nuqs";
import { getSuperAdminSettings } from "@/services/super-admin/settings/get";
import { appendTitleFilter } from "@/constants/productFilters";

export default function ProductsPage() {
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [sort, setSort] = useState<
    "newest" | "oldest" | "stock-asc" | "stock-desc" | "sales-asc" | "sales-desc"
  >("newest");
  const [page] = useQueryState("page", { defaultValue: "1" });
  const [pageSize] = useQueryState("pageSize", { defaultValue: "25" });
  const [, setTotalSize] = useQueryState<number>("totalSize", {
    defaultValue: 0,
    parse: (value: string | undefined) => Number(value) || 0,
    serialize: (value: number) => String(value),
  });

  // For global sort modes, we build an index of product IDs sorted server-assist
  const [sortedProductIds, setSortedProductIds] = useState<number[] | null>(null);
  const [customPageData, setCustomPageData] = useState<Product[] | null>(null);
  const [buildingIndex, setBuildingIndex] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [settings, setSettings] = useState<{filterPublicProductsByTitle: boolean} | null>(null);
  const [localTitleFilter, setLocalTitleFilter] = useState<boolean | null>(null);

  const getAllProductsLite = useCallback(async () => {
    // Fetch product list with minimal payload for stock aggregation
    // We page through the dataset and only pull IDs + variations' stock counts
    const perPage = 200;
    let current = 1;
    let total = 0;
    const items: any[] = [];
    while (true) {
      // Respect super-admin toggled setting for filtering public products
      let endpoint = `/products?pagination[page]=${current}&pagination[pageSize]=${perPage}` +
        (isRecycleBinOpen
          ? `&filters[removedAt][$null]=false`
          : `&filters[removedAt][$null]=true`) +
        `&fields[0]=id` +
        `&populate[0]=product_variations` +
        `&populate[1]=product_variations.product_stock` +
        `&populate[2]=product_main_category`;

      const shouldApplyTitleFilter = localTitleFilter !== null
        ? localTitleFilter
        : settings?.filterPublicProductsByTitle;

      if (shouldApplyTitleFilter && !isRecycleBinOpen) {
        endpoint = appendTitleFilter(endpoint);
      }

      const res = await apiClient.get(endpoint, { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } });
      const data = (res as any).data as any[];
      total = (res as any).meta?.pagination?.total || total;
      items.push(...data);
      const pageCount = (res as any).meta?.pagination?.pageCount || 1;
      if (current >= pageCount) break;
      current += 1;
    }
    return items;
  }, [isRecycleBinOpen, localTitleFilter, settings?.filterPublicProductsByTitle]);

  const buildStockIndex = useCallback(async () => {
    setBuildingIndex(true);
    try {
      const items = await getAllProductsLite();
      const byStock = items
        .map((p: any) => ({
          id: Number(p.id),
          stock: (p?.attributes?.product_variations?.data || []).reduce(
            (acc: number, v: any) =>
              acc + Number(v?.attributes?.product_stock?.data?.attributes?.Count || 0),
            0,
          ),
        }))
        .sort((a: any, b: any) => a.stock - b.stock);
      const ids = byStock.map((x: any) => x.id);
      setSortedProductIds(sort === "stock-asc" ? ids : ids.slice().reverse());
      setTotalSize(ids.length);
    } finally {
      setBuildingIndex(false);
    }
  }, [getAllProductsLite, setTotalSize, sort]);

  const buildSalesIndex = useCallback(async () => {
    setBuildingIndex(true);
    try {
      const rows = await getProductSales({});
      // Aggregate by product via mapping variation -> product (batched)
  const varIds = rows.map((r: any) => r.productVariationId);
      const chunk = 200;
      const varToProduct: Record<number, number> = {};
      for (let i = 0; i < varIds.length; i += chunk) {
        const part = varIds.slice(i, i + chunk);
        // Fetch products that contain these variations
        const res = await apiClient.get(
          `/products?filters[product_variations][id][$in]=${part.join(",")}` +
              (isRecycleBinOpen
                ? `&filters[removedAt][$null]=false`
                : `&filters[removedAt][$null]=true`) +
              `&fields[0]=id&populate[0]=product_variations`,
            { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } },
          );
        const prods = (res as any).data as any[];
        prods.forEach((p: any) => {
          const pid = Number(p.id);
          (p?.attributes?.product_variations?.data || []).forEach((v: any) => {
            varToProduct[Number(v.id)] = pid;
          });
        });
      }
      const productSales: Record<number, number> = {};
      rows.forEach((r: any) => {
        const pid = varToProduct[r.productVariationId];
        if (!pid) return;
        productSales[pid] = (productSales[pid] || 0) + Number(r.totalCount || 0);
      });
      const ids = Object.entries(productSales)
        .sort((a, b) => Number(a[1]) - Number(b[1]))
        .map(([pid]) => Number(pid));
      setSortedProductIds(sort === "sales-asc" ? ids : ids.slice().reverse());
      setTotalSize(ids.length);
    } finally {
      setBuildingIndex(false);
    }
  }, [setTotalSize, sort, isRecycleBinOpen]);

  // Build global sorted index for stock/sales
  useEffect(() => {
    setSortedProductIds(null);
    setCustomPageData(null);
    if (sort === "stock-asc" || sort === "stock-desc") buildStockIndex();
    else if (sort === "sales-asc" || sort === "sales-desc") buildSalesIndex();
  }, [sort, buildStockIndex, buildSalesIndex, localTitleFilter]);

  // Fetch current page data when using custom index
  useEffect(() => {
    const run = async () => {
      if (!sortedProductIds) return;
      setPageLoading(true);
      const p = Math.max(1, parseInt(page || "1", 10));
      const ps = Math.max(1, parseInt(pageSize || "25", 10));
      const start = (p - 1) * ps;
      const ids = sortedProductIds.slice(start, start + ps);
      if (ids.length === 0) {
        setCustomPageData([]);
        setPageLoading(false);
        return;
      }
      const res = await apiClient.get(
        (() => {
          let ep = `/products?filters[id][$in]=${ids.join(",")}` +
            (isRecycleBinOpen
              ? `&filters[removedAt][$null]=false`
              : `&filters[removedAt][$null]=true`) +
            `&populate[0]=CoverImage&populate[1]=product_variations&populate[2]=product_variations.product_stock&populate[3]=product_main_category`;
          const shouldApplyTitleFilter = localTitleFilter !== null
            ? localTitleFilter
            : settings?.filterPublicProductsByTitle;

          if (shouldApplyTitleFilter && !isRecycleBinOpen) {
            ep = appendTitleFilter(ep);
          }
          return ep;
        })(),
        { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } },
      );
      const rows = ((res as any).data as Product[]).slice();
      // Preserve the order of ids
      rows.sort(
        (a, b) => ids.indexOf(Number(a.id)) - ids.indexOf(Number(b.id)),
      );
      setCustomPageData(rows);
      setPageLoading(false);
    };
    run();
  }, [sortedProductIds, page, pageSize, isRecycleBinOpen, localTitleFilter, settings?.filterPublicProductsByTitle]);

  // Fetch settings once on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await getSuperAdminSettings();
        if (!mounted) return;
        setSettings({ filterPublicProductsByTitle: s.filterPublicProductsByTitle });
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // We prefer server-side sorting. This fallback is disabled to avoid page-only sort.
  const _clientSort = undefined;

  return (
    <ContentWrapper
      title="محصولات"
      hasAddButton
      addButtonText="محصول جدید"
      hasFilterButton
      hasPagination
      addButtonPath="/super-admin/products/add"
      hasRecycleBin
      isRecycleBinOpen={isRecycleBinOpen}
      setIsRecycleBinOpen={setIsRecycleBinOpen}
      apiUrl={"/products"}
    >
      <div className="mb-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-600">مرتب‌سازی:</label>
          <select
            className="rounded-lg border border-neutral-300 px-3 py-1 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
          >
            <option value="newest">جدیدترین</option>
            <option value="oldest">قدیمی‌ترین</option>
            <option value="stock-desc">موجودی: بیشترین</option>
            <option value="stock-asc">موجودی: کمترین</option>
            <option value="sales-desc">فروش: بیشترین</option>
            <option value="sales-asc">فروش: کمترین</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-600">فیلتر کیف، کفش، صندل:</label>
          <select
            className="rounded-lg border border-neutral-300 px-3 py-1 text-sm"
            value={localTitleFilter === null ? "global" : localTitleFilter ? "on" : "off"}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "global") {
                setLocalTitleFilter(null);
              } else {
                setLocalTitleFilter(value === "on");
              }
            }}
          >
            <option value="global">پیش‌فرض سایت ({settings?.filterPublicProductsByTitle ? "فعال" : "غیرفعال"})</option>
            <option value="on">فعال</option>
            <option value="off">غیرفعال</option>
          </select>
        </div>
      </div>
      {sort === "newest" || sort === "oldest" ? (
        <SuperAdminTable
          columns={columns}
          url={(() => {
            const base =
              "/products?populate[0]=CoverImage&populate[1]=product_variations&populate[2]=product_variations.product_stock&populate[3]=product_main_category" +
              (isRecycleBinOpen
                ? "&filters[removedAt][$null]=false"
                : "&filters[removedAt][$null]=true");
            const shouldApplyTitleFilter = localTitleFilter !== null
              ? localTitleFilter
              : settings?.filterPublicProductsByTitle;

            let sortedBase = base;
            if (shouldApplyTitleFilter && !isRecycleBinOpen) {
              sortedBase = appendTitleFilter(sortedBase);
            }

            if (sort === "newest") return sortedBase + "&sort[0]=createdAt:desc";
            return sortedBase + "&sort[0]=createdAt:asc";
          })()}
          mobileTable={(data) => <MobileTable data={data} />}
          removeActions
        />
      ) : (
        <div>
          {buildingIndex && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              در حال محاسبه مرتب‌سازی سراسری؛ لطفاً صبر کنید…
            </div>
          )}
          <SuperAdminTable
            columns={columns}
            data={customPageData || []}
            loading={buildingIndex || pageLoading || customPageData === null}
            mobileTable={(data) => <MobileTable data={data as Product[]} />}
            removeActions
          />
        </div>
      )}
    </ContentWrapper>
  );
}
