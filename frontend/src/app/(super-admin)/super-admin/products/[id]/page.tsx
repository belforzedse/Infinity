"use client";
import { use, useEffect, useMemo, useRef } from "react";
import SetDetails from "@/components/Product/add/SetCategory/SetCategory";
import Tabs from "@/components/Kits/Tabs";
import type { TabItem } from "@/types/Tabs";
import Overall from "@/components/Product/add/Overall";
import IndexPhotoUploader from "@/components/Product/add/IndexPhotoUploader";
import Variables from "@/components/Product/add/Variables";
import Sizes, { SizeGuideHandle } from "@/components/Product/add/Size";
import PublishAllVariations from "@/components/Product/add/PublishAllVariations";
import { getProduct } from "@/services/super-admin/product/get";
import { editProductDataAtom } from "@/atoms/super-admin/products";
import { useAtom } from "jotai";
import { transformToProductData } from "@/utils/populatedProductData";
import { updateProduct } from "@/services/super-admin/product/update";
import { duplicateProduct } from "@/services/super-admin/product/duplicate";
import { useRouter } from "next/navigation";
import { useProductCategory } from "@/hooks/product/useCategory";
import { useProductTag } from "@/hooks/product/useTag";
import logger from "@/utils/logger";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import toast from "react-hot-toast";

export default function EditProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const [productData, setProductData] = useAtom(editProductDataAtom);
  const router = useRouter();
  const { roleName } = useCurrentUser();
  const { fetchAllCategories } = useProductCategory();
  const { handleFetchTags } = useProductTag();
  const sizeGuideRef = useRef<SizeGuideHandle | null>(null);

  // Redirect editors away from product pages
  useEffect(() => {
    const normalizedRole = (roleName ?? "").toLowerCase().trim();
    if (normalizedRole === "editor") {
      router.replace("/super-admin/blog");
    }
  }, [roleName, router]);

  const getProductParams = useMemo(
    () => ({
      Files: true,
      Media: true,
      CoverImage: true,
      product_main_category: true,
      product_tags: true,
      product_variations: true,
      product_other_categories: true,
    }),
    [],
  );

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Force fresh data fetch - no cache
        const result = await getProduct(id, getProductParams);
        setProductData(transformToProductData(result.data.attributes));
      } catch (error: any) {
        if (process.env.NODE_ENV !== "production") {
          logger.error("error in fetching product", { error });
        }
      }
    };

    fetchProduct();
  }, [id, setProductData, getProductParams]);

  useEffect(() => {
    // Only fetch categories and tags once on mount to prevent infinite loops
    fetchAllCategories();
    handleFetchTags();
  }, [fetchAllCategories, handleFetchTags]);

  const handleUpdateProduct = async () => {
    const loadingToast = toast.loading("در حال ذخیره...");

    try {
      if (process.env.NODE_ENV !== "production") {
        logger.info("productData2", { productData });
      }

      const sizeSaveResult = await sizeGuideRef.current?.save?.();
      if (sizeSaveResult === false) {
        toast.dismiss(loadingToast);
        toast.error("خطا در ذخیره راهنمای سایز");
        return;
      }

      const result = await updateProduct(id, productData);

      if (result.success) {
        // Refresh product data to reflect changes (especially for image deletion)
        try {
          const refreshedResult = await getProduct(id, getProductParams);
          setProductData(transformToProductData(refreshedResult.data.attributes));
          toast.dismiss(loadingToast);
          toast.success("محصول با موفقیت ذخیره شد");
        } catch (refreshError) {
          // Even if refresh fails, the update was successful
          toast.dismiss(loadingToast);
          toast.success("محصول با موفقیت ذخیره شد");
          console.error("Error refreshing product data:", refreshError);
        }
      } else {
        // Show error toast with the error message
        toast.dismiss(loadingToast);
        const errorMessage = result.errorMessage || "خطا در ذخیره محصول";
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("خطا در ذخیره محصول");
      console.error("Error updating product:", error);
    }
  };

  const handleDuplicateProduct = async () => {
    try {
      const result = await duplicateProduct(id);
      if (result.success && result.newProductId) {
        router.push(`/super-admin/products/${result.newProductId}`);
      }
    } catch (error) {
      console.error("Error duplicating product:", error);
    }
  };

  const tabs: TabItem[] = [
    {
      key: "1",
      value: "کلی",
    },
    {
      key: "2",
      value: "متغیرها",
    },
    {
      key: "3",
      value: "راهنمای سایز",
    },
  ];

  return (
    <div className="flex w-full grid-cols-3 flex-col gap-4 pb-32 lg:grid">
      <div className="order-2 flex flex-col gap-4 lg:order-1">
        <IndexPhotoUploader isEditMode />
        <PublishAllVariations productId={Number(id)} />
        {/* <SetPrice />
        <SetStatus /> */}
        <SetDetails isEditMode />
      </div>
      <div className="order-1 col-span-2 h-fit flex-1 lg:order-2">
        <Tabs tabs={tabs} tabsClassName="!bg-transparent">
          {[
            <Overall key={"overall"} productData={productData} isEditMode />,
            <Variables key={"variables"} productId={Number(id)} />,
            <Sizes key={"sizes"} ref={sizeGuideRef} productId={Number(id)} />,
          ]}
        </Tabs>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-end px-4">
        <div className="pointer-events-auto ml-16 flex w-fit max-w-2xl items-center justify-end gap-2 rounded-3xl border border-slate-200  bg-white/10 px-4 py-2.5 shadow-lg backdrop-blur-lg">
          <button
            className="w-1/3 rounded-xl border-slate-300 hover:bg-slate-300/80 hover:text-slate-800 bg-slate-300/40 border-2 px-5 py-2 text-sm text-slate-500 lg:w-fit"
            onClick={() => router.push("/super-admin/products")}
          >
            بیخیال شدن
          </button>
          <button
            onClick={handleDuplicateProduct}
            className="w-1/3 rounded-xl bg-blue-500/10 hover:bg-blue-500/80 hover:text-white border-blue-200 border-2 px-5 py-2 text-sm text-blue-500 lg:w-fit"
          >
            کپی محصول
          </button>
          <button
            onClick={handleUpdateProduct}
            className="w-1/3 rounded-xl bg-pink-500/10 hover:bg-pink-500/80 hover:text-white px-5 py-2 text-sm text-pink-900 border-pink-200 border-2 lg:w-fit"
          >
            ذخیره
          </button>
        </div>
      </div>
    </div>
  );
}
