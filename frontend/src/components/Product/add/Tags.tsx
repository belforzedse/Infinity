"use client";

import { Combobox } from "@headlessui/react";
import React, { useEffect } from "react";
import ProductChip from "../Chip";
import PlusIcon from "@/components/User/Icons/PlusIcon";
import { useProductTag } from "@/hooks/product/useTag";
import classNames from "classnames";
import { TagResponseType } from "@/services/super-admin/product/tag/get";

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
    handleFetchTags();
  }, []);

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-base text-neutral-600">تگ ها</h2>

      <div className="bg-white rounded-lg border border-slate-100 px-5 py-3 flex flex-col gap-2">
        <Combobox<TagResponseType, false>
          value={undefined}
          onChange={handleSelect}
        >
          <div className="relative">
            <Combobox.Input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-neutral-800"
              onChange={(event) => setQuery(event.target.value)}
              displayValue={() => query}
              placeholder="تگ جدید را انتخاب کنید"
            />
            <Combobox.Options className="absolute mt-1 w-full bg-white border border-slate-200 rounded-lg py-1 shadow-lg z-[99999]">
              {filteredTags.length === 0 ? (
                <button
                  onClick={() => {
                    if (query.trim()) {
                      handleCreateTag(query);
                    }
                  }}
                  className="px-3 py-2 text-neutral-800 flex items-center gap-2"
                >
                  <span className="text-neutral-500 text-xs">
                    {isCreateTagLoading ? "ایجاد تگ........" : "ایجاد تگ جدید"}
                  </span>
                  <PlusIcon
                    className={classNames(
                      "w-4 h-4",
                      isCreateTagLoading && "animate-spin"
                    )}
                  />
                </button>
              ) : (
                filteredTags.map((tag) => (
                  <Combobox.Option
                    key={tag.id}
                    value={tag}
                    className={({ active }) =>
                      `px-3 py-2 cursor-pointer text-neutral-800 ${
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
