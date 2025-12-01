"use client";
import SetDetails from "@/components/Product/add/SetCategory/SetCategory";
import Overall from "@/components/Product/add/Overall";
import IndexPhotoUploader from "@/components/Product/add/IndexPhotoUploader";
import { useEffect } from "react";
import { useProductCategory } from "@/hooks/product/useCategory";
import { productDataAtom, resetProductDataAtom } from "@/atoms/super-admin/products";
import { useAtomValue, useSetAtom } from "jotai";
import { createProduct } from "@/services/super-admin/product/create";
import { useRouter } from "next/navigation";
import logger from "@/utils/logger";
import { useEditorRedirect } from "@/hooks/useEditorRedirect";
import { refreshTable } from "@/components/SuperAdmin/Table";
import { apiCache } from "@/lib/api-cache";

// Define the type for the API response
interface ProductApiResponse {
  success: boolean;
  data?: {
    id: number;
    [key: string]: any;
  };
  error?: any;
}

export default function AddProductsPage() {
  const { fetchAllCategories } = useProductCategory();
  const productData = useAtomValue(productDataAtom);
  const resetProductData = useSetAtom(resetProductDataAtom);
  const router = useRouter();
  const setRefresh = useSetAtom(refreshTable);

  // Redirect editors away from product pages
  useEditorRedirect();
  if (process.env.NODE_ENV !== "production") {
    logger.info("productData", { productData });
  }
  useEffect(() => {
    resetProductData();
  }, [resetProductData]);

  useEffect(() => {
    // Only fetch categories once on mount to prevent multiple API calls
    fetchAllCategories();
  }, [fetchAllCategories]);

  const handleCreateProduct = async () => {
    try {
      const result = (await createProduct(productData)) as ProductApiResponse;
      if (result.success && result.data) {
        // Clear product-related cache entries to ensure fresh data
        // Do this immediately before redirect to ensure cache is cleared
        apiCache.clearByPattern(/\/api\/products/i);

        // Get the product ID from the response and redirect to its edit page
        const productId = result.data?.id;
        if (productId) {
          // Trigger table refresh before redirecting
          setRefresh(true);
          router.push(`/super-admin/products/${productId}`);
        } else {
          // Fallback to products list if ID is not available
          // Trigger table refresh before redirecting
          setRefresh(true);
          router.push("/super-admin/products");
          // Force Next.js to refresh the page data
          router.refresh();
        }
      } else {
        // Fallback to products list if no data is available
        // Clear product-related cache entries
        apiCache.clearByPattern(/\/api\/products/i);
        // Trigger table refresh before redirecting
        setRefresh(true);
        router.push("/super-admin/products");
        // Force Next.js to refresh the page data
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating product:", error);
    }
  };

  return (
    <div className="flex w-full grid-cols-3 flex-col gap-4 lg:grid">
      <div className="order-2 flex flex-col gap-4 lg:order-1">
        <IndexPhotoUploader />
        <SetDetails />
      </div>

      <div className="order-1 col-span-2 h-fit flex-1 lg:order-2">
        <Overall key={"overall"} />
      </div>

<div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 backdrop-blur px-4 py-2.5 flex items-center justify-end gap-2">
  <button className="w-1/2 rounded-xl bg-slate-200 px-5 py-2 text-sm text-slate-500 lg:w-fit">
    بیخیال شدن
  </button>
  <button
    onClick={handleCreateProduct}
    className="w-1/2 rounded-xl bg-pink-500 px-5 py-2 text-sm text-white lg:w-fit"
  >
    ذخیره
  </button>
</div>

    </div>
  );
}
