"use client";

import { Combobox } from "@headlessui/react";
import React, { useEffect } from "react";
import ProductChip from "../Chip";
import PlusIcon from "@/components/User/Icons/PlusIcon";
import { useProductTag } from "@/hooks/product/useTag";
import classNames from "classnames";
import type { TagResponseType } from "@/services/super-admin/product/tag/get";

interface TagsProps {
  isEditMode?: boolean;
}

const Tags: React.FC<TagsProps> = ({ isEditMode = false }) => {
  const {
    tags,
    query,
    filteredTags,
    handleSelect,
    removeTag,
    setQuery,
    handleCreateTag,
    handleFetchTags,
    isCreateTagLoading,
  } = useProductTag({ isEditMode });

  useEffect(() => {
    // Only fetch tags once on mount to prevent infinite loops
    handleFetchTags();
  }, [handleFetchTags]);

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-base text-neutral-600">تگ ها</h2>

      <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white px-5 py-3">
        <Combobox<TagResponseType, false> value={undefined} onChange={handleSelect}>
          <div className="relative">
            <Combobox.Input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-neutral-800"
              onChange={(event) => setQuery(event.target.value)}
              displayValue={() => query}
              placeholder="تگ جدید را انتخاب کنید"
            />
            <Combobox.Options className="absolute z-[99999] mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              {filteredTags.length === 0 ? (
                <button
                  onClick={() => {
                    if (query.trim()) {
                      handleCreateTag(query);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-neutral-800"
                >
                  <span className="text-xs text-neutral-500">
                    {isCreateTagLoading ? "ایجاد تگ........" : "ایجاد تگ جدید"}
                  </span>
                  <PlusIcon
                    className={classNames("h-4 w-4", isCreateTagLoading && "animate-spin")}
                  />
                </button>
              ) : (
                filteredTags.map((tag) => (
                  <Combobox.Option
                    key={tag.id}
                    value={tag}
                    className={({ active }) =>
                      `cursor-pointer px-3 py-2 text-neutral-800 ${
                        active ? "bg-slate-100" : "bg-white"
                      }`
                    }
                  >
                    {tag.attributes.Title}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </div>
        </Combobox>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <ProductChip
                key={tag.id}
                onDeleteFunction={() => removeTag(tag)}
                title={tag.attributes.Title}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tags;
