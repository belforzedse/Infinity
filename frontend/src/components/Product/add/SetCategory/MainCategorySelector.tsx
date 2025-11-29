import { Combobox } from "@headlessui/react";
import React, { useEffect, useState, useMemo } from "react";
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
import { useProductCategory } from "@/hooks/product/useCategory";

interface MainCategorySelectorProps {
  isEditMode?: boolean;
}

function MainCategorySelector({ isEditMode = false }: MainCategorySelectorProps) {
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const CategoriesData = useAtomValue(productCategoryDataAtom);
  const [draftProductData, setDraftProductData] = useAtom(productDataAtom);
  const [existingProductData, setExistingProductData] = useAtom(editProductDataAtom);
  const { fetchAllCategories } = useProductCategory({ isEditMode });

  const productData = isEditMode ? existingProductData : draftProductData;

  // Fetch categories if not already loaded
  useEffect(() => {
    if (!Array.isArray(CategoriesData) || CategoriesData.length === 0) {
      fetchAllCategories();
    }
  }, [CategoriesData, fetchAllCategories]);

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

  const onChangeMainCategory = (category: categoryResponseType | null) => {
    if (!category) {
      // Clear selection
      setSelectedMainCategoryId(null);
      if (isEditMode) {
        setExistingProductData((prev: EditProductData) => ({
          ...prev,
          product_main_category: null,
        }));
      } else {
        setDraftProductData((prev: ProductData) => ({
          ...prev,
          product_main_category: null,
        }));
      }
      setSearchQuery("");
      return;
    }

    setSelectedMainCategoryId(String(category.id));

    if (isEditMode) {
      setExistingProductData((prev: EditProductData) => ({
        ...prev,
        product_main_category: category,
      }));
    } else {
      setDraftProductData((prev: ProductData) => ({
        ...prev,
        product_main_category: category,
      }));
    }
    setSearchQuery("");
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

  const filteredCategories = useMemo(() => {
    if (!Array.isArray(CategoriesData) || CategoriesData.length === 0) {
      return [];
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return CategoriesData;
    }

    return CategoriesData.filter((category: categoryResponseType) => {
      const title = (category.attributes?.Title || "").toLowerCase();
      const slug = (category.attributes?.Slug || "").toLowerCase();
      return title.includes(query) || slug.includes(query);
    });
  }, [CategoriesData, searchQuery]);

  const selectedCategory = useMemo(() => {
    if (!selectedMainCategoryId || !Array.isArray(CategoriesData)) {
      return null;
    }
    return CategoriesData.find((cat: categoryResponseType) => cat.id.toString() === selectedMainCategoryId) || null;
  }, [selectedMainCategoryId, CategoriesData]);

  return (
    <>
      <div className="flex flex-col gap-1">
        <Combobox<categoryResponseType, false>
          value={selectedCategory}
          onChange={onChangeMainCategory}
        >
          <div className="relative">
            <Combobox.Input
              className="w-full rounded-lg border border-slate-100 px-3 py-3 text-sm text-right text-neutral-600 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
              onChange={(event) => {
                setSearchQuery(event.target.value);
                // Clear selection when user starts typing
                if (event.target.value && selectedCategory) {
                  onChangeMainCategory(null);
                }
              }}
              displayValue={() => {
                // When a category is selected and user isn't searching, show the category name
                if (selectedCategory && !searchQuery) {
                  return selectedCategory.attributes?.Title || "";
                }
                // Otherwise show the search query
                return searchQuery;
              }}
              placeholder="انتخاب دسته بندی اصلی"
            />
            <Combobox.Options className="absolute z-[60] mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              {filteredCategories.length === 0 ? (
                <div className="px-4 py-2 text-sm text-neutral-500">
                  {searchQuery ? "نتیجه‌ای یافت نشد" : "دسته‌بندی‌ای موجود نیست"}
                </div>
              ) : (
                filteredCategories.map((category: categoryResponseType) => (
                  <Combobox.Option
                    key={category.id}
                    value={category}
                    className={({ active }) =>
                      `cursor-pointer px-4 py-2 text-sm text-neutral-800 ${
                        active ? "bg-slate-100" : "bg-white"
                      }`
                    }
                  >
                    {({ selected }) => (
                      <div className="flex items-center justify-between">
                        <span className={selected ? "font-medium" : "font-normal"}>
                          {category.attributes?.Title || "-"}
                        </span>
                        {category.attributes?.Slug && (
                          <span className="text-xs text-neutral-400" dir="ltr">
                            ({category.attributes.Slug})
                          </span>
                        )}
                      </div>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </div>
        </Combobox>
      </div>

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
