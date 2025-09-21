import Select, { Option } from "@/components/Kits/Form/Select";
import React, { useEffect, useState } from "react";
import PlusIcon from "../../Icons/PlusIcon";
import SetCategoryModal from "./Modal";
import { editProductDataAtom, productCategoryDataAtom } from "@/atoms/super-admin/products";
import { useAtomValue, useAtom } from "jotai";
import { productDataAtom } from "@/atoms/super-admin/products";
import { usePathname } from "next/navigation";
import { categoryResponseType } from "@/services/super-admin/product/category/getAll";

interface MainCategorySelectorProps {
  isEditMode?: boolean;
}

function MainCategorySelector({ isEditMode = false }: MainCategorySelectorProps) {
  const [selectedMainCategory, setSelectedMainCategory] = useState<Option | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const pathname = usePathname();

  const CategoriesData = useAtomValue(productCategoryDataAtom);
  const [productData, setProductData] = useAtom(isEditMode ? editProductDataAtom : productDataAtom);

  const onChangeMainCategory = (value: Option) => {
    setSelectedMainCategory(value);
    const category: categoryResponseType = {
      id: Number(value.id),
      attributes: {
        Title: value.name,
        Slug: value.name.toLowerCase(),
      },
    };

    setProductData({
      ...(productData as any),
      product_main_category: category,
    });
  };

  useEffect(() => {
    if (productData.product_main_category && !pathname.endsWith("/add")) {
      const mainCategoryData = productData.product_main_category;

      if (mainCategoryData) {
        setSelectedMainCategory({
          id: mainCategoryData.id.toString(),
          name: mainCategoryData.attributes.Title,
        });
      }
    } else {
      setSelectedMainCategory(null);
    }
  }, [productData.product_main_category, pathname]);

  return (
    <>
      <Select
        className="w-full"
        value={selectedMainCategory}
        onChange={(value) => onChangeMainCategory(value)}
        options={CategoriesData.map((category: any) => ({
          id: category.id.toString(),
          name: category.attributes.Title,
        }))}
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
