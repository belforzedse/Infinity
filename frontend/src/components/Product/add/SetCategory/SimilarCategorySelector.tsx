"use client";

import { Combobox } from "@headlessui/react";
import React from "react";
import { useProductCategory } from "@/hooks/product/useCategory";
import ProductChip from "../../Chip";
import { categoryResponseType } from "@/services/super-admin/product/cetegory/getAll";

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

      <div className="bg-white rounded-lg border border-slate-100 px-5 py-3 flex flex-col gap-2">
        <Combobox<categoryResponseType, false>
          value={undefined}
          onChange={handleSelectOtherCategory}
        >
          <div className="relative">
            <Combobox.Input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-neutral-800"
              onChange={(event) => setCategorySearchQuery(event.target.value)}
              displayValue={() => categorySearchQuery}
              placeholder="دسته بندی را انتخاب کنید"
            />
            <Combobox.Options className="absolute mt-1 w-full bg-white border border-slate-200 rounded-lg py-1 shadow-lg z-[99999]">
              {filteredTags.length === 0 ? (
                <button className="px-3 py-2 text-neutral-800 flex items-center gap-2">
                  <span className="text-neutral-500 text-xs">
                    نتیجه ای یافت نشد
                  </span>
                </button>
              ) : (
                filteredTags.map((category) => (
                  <Combobox.Option
                    key={category.id}
                    value={category}
                    className={({ active }) =>
                      `px-3 py-2 cursor-pointer text-neutral-800  ${
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
