"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, columns, Product } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { useCallback, useEffect, useState, useMemo } from "react";
import { getProductSales } from "@/services/super-admin/reports/productSales";
import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";
import { useQueryState } from "nuqs";
import { getSuperAdminSettings } from "@/services/super-admin/settings/get";
import { appendTitleFilter } from "@/constants/productFilters";
import toast from "react-hot-toast";
import { useAtom } from "jotai";
import { refreshTable } from "@/components/SuperAdmin/Table";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [, setRefresh] = useAtom(refreshTable);

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

      if (searchQuery.trim()) {
        endpoint += `&filters[Title][$containsi]=${encodeURIComponent(searchQuery.trim())}`;
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
  }, [isRecycleBinOpen, localTitleFilter, settings?.filterPublicProductsByTitle, searchQuery]);

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

          if (searchQuery.trim()) {
            ep += `&filters[Title][$containsi]=${encodeURIComponent(searchQuery.trim())}`;
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
  }, [sortedProductIds, page, pageSize, isRecycleBinOpen, localTitleFilter, settings?.filterPublicProductsByTitle, searchQuery]);

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

  // Bulk actions handler
  const handleBulkAction = useCallback(async (actionId: string, selectedProducts: Product[]) => {
    if (!selectedProducts.length) {
      toast.error("هیچ محصولی انتخاب نشده است");
      return;
    }

    try {
      switch (actionId) {
        case "remove_stock":
          // Remove stock from all selected products
          let removedStockCount = 0;
          for (const product of selectedProducts) {
            for (const variation of product.attributes.product_variations.data) {
              if (variation.attributes.product_stock?.data?.id) {
                try {
                  await apiClient.put(
                    `/product-stocks/${variation.attributes.product_stock.data.id}`,
                    {
                      data: { Count: 0 }
                    },
                    {
                      headers: { Authorization: `Bearer ${STRAPI_TOKEN}` }
                    }
                  );
                  removedStockCount++;
                } catch (error) {
                  console.error(`Failed to remove stock for variation ${variation.id}:`, error);
                }
              }
            }
          }
          toast.success(`موجودی ${removedStockCount} تنوع محصول با موفقیت حذف شد`);
          break;

        case "soft_delete":
          // Soft delete selected products
          let deletedCount = 0;
          for (const product of selectedProducts) {
            try {
              await apiClient.put(
                `/products/${product.id}`,
                {
                  data: { removedAt: new Date().toISOString() }
                },
                {
                  headers: { Authorization: `Bearer ${STRAPI_TOKEN}` }
                }
              );
              deletedCount++;
            } catch (error) {
              console.error(`Failed to delete product ${product.id}:`, error);
            }
          }
          toast.success(`${deletedCount} محصول با موفقیت حذف شد`);
          break;

        case "restore":
          // Restore selected products
          let restoredCount = 0;
          for (const product of selectedProducts) {
            try {
              await apiClient.put(
                `/products/${product.id}`,
                {
                  data: { removedAt: null }
                },
                {
                  headers: { Authorization: `Bearer ${STRAPI_TOKEN}` }
                }
              );
              restoredCount++;
            } catch (error) {
              console.error(`Failed to restore product ${product.id}:`, error);
            }
          }
          toast.success(`${restoredCount} محصول با موفقیت بازیابی شد`);
          break;

        case "set_stock":
          // Set stock to a specific value
          const stockValue = prompt("مقدار موجودی جدید را وارد کنید:");
          if (stockValue && !isNaN(Number(stockValue))) {
            const newStock = Math.max(0, Number(stockValue));
            let updatedStockCount = 0;
            for (const product of selectedProducts) {
              for (const variation of product.attributes.product_variations.data) {
                if (variation.attributes.product_stock?.data?.id) {
                  try {
                    await apiClient.put(
                      `/product-stocks/${variation.attributes.product_stock.data.id}`,
                      {
                        data: { Count: newStock }
                      },
                      {
                        headers: { Authorization: `Bearer ${STRAPI_TOKEN}` }
                      }
                    );
                    updatedStockCount++;
                  } catch (error) {
                    console.error(`Failed to update stock for variation ${variation.id}:`, error);
                  }
                }
              }
            }
            toast.success(`موجودی ${updatedStockCount} تنوع محصول به ${newStock} تنظیم شد`);
          } else if (stockValue !== null) {
            toast.error("مقدار موجودی معتبر نیست");
            return;
          } else {
            return; // User cancelled
          }
          break;

        case "publish":
          // Publish selected products
          let publishedCount = 0;
          for (const product of selectedProducts) {
            for (const variation of product.attributes.product_variations.data) {
              try {
                await apiClient.put(
                  `/product-variations/${variation.id}`,
                  {
                    data: { IsPublished: true }
                  },
                  {
                    headers: { Authorization: `Bearer ${STRAPI_TOKEN}` }
                  }
                );
                publishedCount++;
              } catch (error) {
                console.error(`Failed to publish variation ${variation.id}:`, error);
              }
            }
          }
          toast.success(`${publishedCount} تنوع محصول منتشر شد`);
          break;

        case "unpublish":
          // Unpublish selected products
          let unpublishedCount = 0;
          for (const product of selectedProducts) {
            for (const variation of product.attributes.product_variations.data) {
              try {
                await apiClient.put(
                  `/product-variations/${variation.id}`,
                  {
                    data: { IsPublished: false }
                  },
                  {
                    headers: { Authorization: `Bearer ${STRAPI_TOKEN}` }
                  }
                );
                unpublishedCount++;
              } catch (error) {
                console.error(`Failed to unpublish variation ${variation.id}:`, error);
              }
            }
          }
          toast.success(`${unpublishedCount} تنوع محصول از انتشار خارج شد`);
          break;

        default:
          toast.error("عملیات نامعتبر");
          return;
      }

      // Refresh the table after successful operation
      setRefresh(true);
    } catch (error) {
      console.error("Bulk action error:", error);
      toast.error("خطا در انجام عملیات دسته‌جمعی");
    }
  }, [setRefresh]);

  // Bulk action options
  const bulkOptions = useMemo(() => {
    if (isRecycleBinOpen) {
      return [
        { id: "restore", title: "بازیابی محصولات" },
      ];
    }
    return [
      { id: "remove_stock", title: "حذف موجودی" },
      { id: "set_stock", title: "تنظیم موجودی" },
      { id: "publish", title: "انتشار محصولات" },
      { id: "unpublish", title: "لغو انتشار محصولات" },
      { id: "soft_delete", title: "حذف محصولات" },
    ];
  }, [isRecycleBinOpen]);

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
      <div className="mb-3 space-y-3">
        <div className="flex items-center gap-4">
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
            <label className="text-sm text-neutral-600">فیلتر کیف، کفش، صندل، کتونی:</label>
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

        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-600">جستجو:</label>
          <input
            type="text"
            placeholder="جستجو در عنوان محصولات..."
            className="w-64 rounded-lg border border-neutral-300 px-3 py-1 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              پاک کردن
            </button>
          )}
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

            if (searchQuery.trim()) {
              sortedBase += `&filters[Title][$containsi]=${encodeURIComponent(searchQuery.trim())}`;
            }

            if (sort === "newest") return sortedBase + "&sort[0]=createdAt:desc";
            return sortedBase + "&sort[0]=createdAt:asc";
          })()}
          mobileTable={(data, selectionProps) => (
            <MobileTable
              data={data}
              enableSelection={selectionProps?.enableSelection}
              selectedIds={selectionProps?.selectedIds}
              onSelectionChange={selectionProps?.onSelectionChange}
            />
          )}
          removeActions
          enableSelection
          getRowId={(row: Product) => row.id}
          bulkOptions={bulkOptions}
          onBulkAction={handleBulkAction}
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
            mobileTable={(data, selectionProps) => (
              <MobileTable
                data={data as Product[]}
                enableSelection={selectionProps?.enableSelection}
                selectedIds={selectionProps?.selectedIds}
                onSelectionChange={selectionProps?.onSelectionChange}
              />
            )}
            removeActions
            enableSelection
            getRowId={(row: Product) => row.id}
            bulkOptions={bulkOptions}
            onBulkAction={handleBulkAction}
          />
        </div>
      )}
    </ContentWrapper>
  );
}
