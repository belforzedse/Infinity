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

  const getProductParams = useMemo(() => ({
    Files: true,
    Media: true,
    CoverImage: true,
    product_main_category: true,
    product_tags: true,
    product_variations: true,
    product_other_categories: true,
  }), []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const result = await getProduct(id, getProductParams);
        setProductData(transformToProductData(result.data.attributes));
      } catch (error: any) {
        console.log("error in fetching product: ", error);
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
      console.log("productData2", productData);

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
    <div className="w-full grid-cols-3 lg:grid flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:order-1 order-2">
        <IndexPhotoUploader isEditMode />
        {/* <SetPrice />
        <SetStatus /> */}
        <SetDetails isEditMode />
      </div>
      <div className="col-span-2 flex-1 lg:order-2 order-1 h-fit">
        <Tabs tabs={tabs} tabsClassName="!bg-transparent">
          {[
            <Overall key={"overall"} productData={productData} isEditMode />,
            <Variables key={"variables"} productId={Number(id)} />,
            <Sizes key={"sizes"} productId={Number(id)} />,
          ]}
        </Tabs>
      </div>

      <div className="border-t border-slate-200 flex justify-end items-center col-span-3 pt-2.5 mt-2 gap-2 order-3">
        <button
          className="rounded-xl bg-slate-200 text-slate-500 py-2 px-5 text-sm lg:w-fit w-1/2"
          onClick={() => router.push("/super-admin/products")}
        >
          بیخیال شدن
        </button>
        <button
          onClick={handleUpdateProduct}
          className="rounded-xl bg-pink-500 text-white py-2 px-5 text-sm lg:w-fit w-1/2"
        >
          ذخیره
        </button>
      </div>
    </div>
  );
}
