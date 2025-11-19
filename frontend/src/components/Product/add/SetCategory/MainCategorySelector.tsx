import type { Option } from "@/components/Kits/Form/Select";
import Select from "@/components/Kits/Form/Select";
import React, { useEffect, useState } from "react";
import PlusIcon from "../../Icons/PlusIcon";
import SetCategoryModal from "./Modal";
import {
  editProductDataAtom,
  productCategoryDataAtom,
  productDataAtom,
} from "@/atoms/super-admin/products";
import { useAtomValue, useAtom } from "jotai";
import type { categoryResponseType } from "@/services/super-admin/product/category/getAll";
import type { EditProductData, ProductData } from "@/types/super-admin/products";

interface MainCategorySelectorProps {
  isEditMode?: boolean;
}

function MainCategorySelector({ isEditMode = false }: MainCategorySelectorProps) {
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const CategoriesData = useAtomValue(productCategoryDataAtom);
  const [draftProductData, setDraftProductData] = useAtom(productDataAtom);
  const [existingProductData, setExistingProductData] = useAtom(editProductDataAtom);

  const productData = isEditMode ? existingProductData : draftProductData;

  // Debug logging - use useEffect to log when CategoriesData changes
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("MainCategorySelector: CategoriesData changed:", CategoriesData);
      console.log("MainCategorySelector: CategoriesData length:", CategoriesData?.length || 0);
      console.log("MainCategorySelector: Is array?", Array.isArray(CategoriesData));
      if (Array.isArray(CategoriesData) && CategoriesData.length > 0) {
        console.log("MainCategorySelector: First category:", CategoriesData[0]);
      }
    }
  }, [CategoriesData]);

  const onChangeMainCategory = (value: Option) => {
    setSelectedMainCategoryId(String(value.id));
    const category: categoryResponseType = {
      id: Number(value.id),
      attributes: {
        Title: value.name,
        Slug: value.name.toLowerCase(),
      },
    };

    if (isEditMode) {
      setExistingProductData((prev: EditProductData) => ({
        ...prev,
        product_main_category: category,
      }));
      return;
    }

    setDraftProductData((prev: ProductData) => ({
      ...prev,
      product_main_category: category,
    }));
  };

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const mainCategoryData = productData.product_main_category;

    if (mainCategoryData) {
      setSelectedMainCategoryId(mainCategoryData.id.toString());
    } else {
      setSelectedMainCategoryId(null);
    }
  }, [isEditMode, productData.product_main_category]);

  const options: Option[] =
    Array.isArray(CategoriesData) && CategoriesData.length > 0
      ? CategoriesData.map((category: any) => ({
          id: category.id?.toString() || String(category.id),
          name: category.attributes?.Title || "-",
        }))
      : [];

  const selectedOption =
    (selectedMainCategoryId && options.find((option) => option.id === selectedMainCategoryId)) ||
    null;

  return (
    <>
      <Select
        className="w-full"
        value={selectedOption}
        onChange={(value) => onChangeMainCategory(value)}
        options={options}
        placeholder="انتخاب دسته بندی اصلی"
      />

      <button
        onClick={() => setIsCategoryModalOpen(true)}
        className="mb-3 flex w-full items-center justify-center gap-1 rounded-xl bg-pink-500 py-2 text-white transition-colors"
      >
        <span className="text-sm">افزودن دسته بندی جدید</span>
        <PlusIcon />
      </button>

      <SetCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </>
  );
}

export default MainCategorySelector;
