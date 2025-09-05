"use client";
import { use, useEffect, useMemo } from "react";
import SetDetails from "@/components/Product/add/SetCategory/SetCategory";
import Tabs from "@/components/Kits/Tabs";
import { TabItem } from "@/types/Tabs";
import Overall from "@/components/Product/add/Overall";
import IndexPhotoUploader from "@/components/Product/add/IndexPhotoUploader";
import Variables from "@/components/Product/add/Variables";
import Sizes from "@/components/Product/add/Size";
import { getProduct } from "@/services/super-admin/product/get";
import { editProductDataAtom } from "@/atoms/super-admin/products";
import { useAtom } from "jotai";
import { transformToProductData } from "@/utils/populatedProductData";
import { updateProduct } from "@/services/super-admin/product/update";
import { useRouter } from "next/navigation";
import { useProductCategory } from "@/hooks/product/useCategory";
import { useProductTag } from "@/hooks/product/useTag";

export default function EditProductsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const [productData, setProductData] = useAtom(editProductDataAtom);
  const router = useRouter();
  const { fetchAllCategories } = useProductCategory();
  const { handleFetchTags } = useProductTag();

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
        const result = await getProduct(id, getProductParams);
        setProductData(transformToProductData(result.data.attributes));
      } catch (error: any) {
        if (process.env.NODE_ENV !== "production") {
          console.log("error in fetching product: ", error);
        }
      }
    };

    fetchProduct();
  }, [id, setProductData, getProductParams]);

  useEffect(() => {
    fetchAllCategories();
    handleFetchTags();
  }, [fetchAllCategories, handleFetchTags]);

  const handleUpdateProduct = async () => {
    try {
      if (process.env.NODE_ENV !== "production") {
        console.log("productData2", productData);
      }

      const result = await updateProduct(id, productData);
      if (result.success) {
        router.push("/super-admin/products");
      }
    } catch (error) {
      console.error("Error updating product:", error);
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
    <div className="flex w-full grid-cols-3 flex-col gap-4 lg:grid">
      <div className="order-2 flex flex-col gap-4 lg:order-1">
        <IndexPhotoUploader isEditMode />
        {/* <SetPrice />
        <SetStatus /> */}
        <SetDetails isEditMode />
      </div>
      <div className="order-1 col-span-2 h-fit flex-1 lg:order-2">
        <Tabs tabs={tabs} tabsClassName="!bg-transparent">
          {[
            <Overall key={"overall"} productData={productData} isEditMode />,
            <Variables key={"variables"} productId={Number(id)} />,
            <Sizes key={"sizes"} productId={Number(id)} />,
          ]}
        </Tabs>
      </div>

      <div className="order-3 col-span-3 mt-2 flex items-center justify-end gap-2 border-t border-slate-200 pt-2.5">
        <button
          className="text-sm w-1/2 rounded-xl bg-slate-200 px-5 py-2 text-slate-500 lg:w-fit"
          onClick={() => router.push("/super-admin/products")}
        >
          بیخیال شدن
        </button>
        <button
          onClick={handleUpdateProduct}
          className="text-sm w-1/2 rounded-xl bg-pink-500 px-5 py-2 text-white lg:w-fit"
        >
          ذخیره
        </button>
      </div>
    </div>
  );
}
