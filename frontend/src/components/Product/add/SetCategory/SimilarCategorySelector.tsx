"use client";

import { Combobox } from "@headlessui/react";
import React from "react";
import { useProductCategory } from "@/hooks/product/useCategory";
import ProductChip from "../../Chip";
import { categoryResponseType } from "@/services/super-admin/product/category/getAll";

interface SimilarCategorySelectorProps {
  isEditMode?: boolean;
}

const SimilarCategorySelector: React.FC<SimilarCategorySelectorProps> = ({
  isEditMode = false,
}) => {
  const {
    selectedCategories,
    categorySearchQuery,
    handleSelectOtherCategory,
    removeOtherCategory,
    setCategorySearchQuery,
    filteredTags,
  } = useProductCategory({ isEditMode });

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-base text-neutral-600">دسته بندی های مشابه</h2>

      <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white px-5 py-3">
        <Combobox<categoryResponseType, false>
          value={undefined}
          onChange={handleSelectOtherCategory}
        >
          <div className="relative">
            <Combobox.Input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-neutral-800"
              onChange={(event) => setCategorySearchQuery(event.target.value)}
              displayValue={() => categorySearchQuery}
              placeholder="دسته بندی را انتخاب کنید"
            />
            <Combobox.Options className="absolute z-[99999] mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              {filteredTags.length === 0 ? (
                <button className="flex items-center gap-2 px-3 py-2 text-neutral-800">
                  <span className="text-xs text-neutral-500">
                    نتیجه ای یافت نشد
                  </span>
                </button>
              ) : (
                filteredTags.map((category) => (
                  <Combobox.Option
                    key={category.id}
                    value={category}
                    className={({ active }) =>
                      `cursor-pointer px-3 py-2 text-neutral-800 ${
                        active ? "bg-slate-100" : "bg-white"
                      }`
                    }
                  >
                    {category.attributes.Title}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </div>
        </Combobox>

        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((category: categoryResponseType) => (
              <ProductChip
                key={category.id}
                onDeleteFunction={() => removeOtherCategory(category)}
                title={category.attributes.Title}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimilarCategorySelector;
