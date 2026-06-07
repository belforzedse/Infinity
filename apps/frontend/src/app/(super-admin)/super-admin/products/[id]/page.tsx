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
      // Deep-populate variations so simple-product fields (stock + attribute-less
      // detection) can be reconstructed for the edit form.
      product_variations: {
        product_stock: true,
        product_variation_color: true,
        product_variation_size: true,
        product_variation_model: true,
      },
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

  const isSimpleProduct = productData.ProductType === "Simple";

  const tabs: TabItem[] = [
    {
      key: "1",
      value: "کلی",
    },
    ...(!isSimpleProduct
      ? [
          {
            key: "2",
            value: "متغیرها",
          },
        ]
      : []),
    {
      key: "3",
      value: "راهنمای سایز",
    },
  ];

  return (
    <div className="flex w-full grid-cols-3 flex-col gap-4 pb-32 lg:grid">
      <div className="order-2 flex flex-col gap-4 lg:order-1">
        <IndexPhotoUploader isEditMode />
        {!isSimpleProduct && <PublishAllVariations productId={Number(id)} />}
        {/* <SetPrice />
        <SetStatus /> */}
        <SetDetails isEditMode />
      </div>
      <div className="order-1 col-span-2 h-fit flex-1 lg:order-2">
        <Tabs tabs={tabs} tabsClassName="!bg-transparent">
          {[
            <Overall key={"overall"} productData={productData} isEditMode />,
            ...(!isSimpleProduct
              ? [<Variables key={"variables"} productId={Number(id)} />]
              : []),
            <Sizes key={"sizes"} ref={sizeGuideRef} productId={Number(id)} />,
          ]}
        </Tabs>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-30 flex justify-center px-4 pb-[env(safe-area-inset-bottom)] md:bottom-4 md:justify-end">
        <div className="pointer-events-auto grid w-full max-w-lg grid-cols-3 gap-2 rounded-3xl border border-slate-200 bg-white/85 px-4 py-2.5 shadow-lg backdrop-blur-lg md:ml-16 md:flex md:w-fit md:max-w-2xl md:items-center md:justify-end md:bg-white/10">
          <button
            className="w-full rounded-xl border-2 border-slate-300 bg-slate-300/40 px-3 py-2 text-sm text-slate-500 hover:bg-slate-300/80 hover:text-slate-800 md:w-fit md:px-5"
            onClick={() => router.push("/super-admin/products")}
          >
            بیخیال شدن
          </button>
          <button
            onClick={handleDuplicateProduct}
            className="w-full rounded-xl border-2 border-blue-200 bg-blue-500/10 px-3 py-2 text-sm text-blue-500 hover:bg-blue-500/80 hover:text-white md:w-fit md:px-5"
          >
            کپی محصول
          </button>
          <button
            onClick={handleUpdateProduct}
            className="w-full rounded-xl border-2 border-pink-200 bg-pink-500/10 px-3 py-2 text-sm text-pink-900 hover:bg-pink-500/80 hover:text-white md:w-fit md:px-5"
          >
            ذخیره
          </button>
        </div>
      </div>
    </div>
  );
}
