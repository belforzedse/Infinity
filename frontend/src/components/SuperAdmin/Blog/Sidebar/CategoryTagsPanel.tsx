"use client";

import React, { useState } from "react";
import { ChevronDown, FolderOpen, Tag, Plus, X } from "lucide-react";
import type { BlogCategory, BlogTag } from "@/services/blog/blog.service";

type TabKey = "categories" | "tags";

interface CategoryTagsPanelProps {
  selectedCategory?: number;
  onCategoryChange: (categoryId: number | undefined) => void;
  categories: BlogCategory[];
  onAddCategory?: (name: string, parentId?: number) => Promise<void>;
  selectedTags: number[];
  onTagsChange: (tagIds: number[]) => void;
  tags: BlogTag[];
  onAddTag?: (name: string) => Promise<void>;
}

export default function CategoryTagsPanel({
  selectedCategory,
  onCategoryChange,
  categories,
  onAddCategory,
  selectedTags,
  onTagsChange,
  tags,
  onAddTag,
}: CategoryTagsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("categories");

  // Category state
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState<number | undefined>();
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Tag state
  const [showAddTagForm, setShowAddTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !onAddCategory) return;

    setIsAddingCategory(true);
    try {
      await onAddCategory(newCategoryName.trim(), parentCategoryId);
      setNewCategoryName("");
      setParentCategoryId(undefined);
      setShowAddCategoryForm(false);
    } catch (error) {
      // Error already shown via toast in page.tsx handler
      // Optional: Add additional logging or state recovery here
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleTagSelect = (value: string) => {
    if (!value) return;
    const tagId = Number(value);
    if (!Number.isNaN(tagId) && !selectedTags.includes(tagId)) {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const handleRemoveTag = (tagId: number) => {
    onTagsChange(selectedTags.filter((id) => id !== tagId));
  };

  const handleAddTag = async () => {
    if (!newTagName.trim() || !onAddTag) return;

    setIsAddingTag(true);
    try {
      await onAddTag(newTagName.trim());
      setNewTagName("");
      setShowAddTagForm(false);
    } catch (error) {
      // Error already shown via toast in page.tsx handler
      // Optional: Add additional logging or state recovery here
    } finally {
      setIsAddingTag(false);
    }
  };

  const selectedTagObjects = tags.filter((tag) => selectedTags.includes(tag.id));

  const handleSave = () => {
    if (activeTab === "categories") {
      if (showAddCategoryForm && newCategoryName.trim()) {
        handleAddCategory();
      }
    } else if (activeTab === "tags") {
      if (showAddTagForm && newTagName.trim()) {
        handleAddTag();
      }
    }
  };

  const isSaving = activeTab === "categories" ? isAddingCategory : isAddingTag;

  return (
    <div className="rounded-2xl bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
            {activeTab === "categories" ? (
              <FolderOpen className="h-4 w-4 text-slate-500" />
            ) : (
              <Tag className="h-4 w-4 text-slate-500" />
            )}
          </div>
          <span className="text-sm font-medium text-neutral-800">
            {activeTab === "categories" ? "دسته بندی" : "برچسب‌ها"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          {isSaving ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
          ) : null}
          <span>ذخیره</span>
        </button>
      </div>

      <div className="mt-4 flex rounded-xl border border-slate-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm transition ${
            activeTab === "categories"
              ? "bg-pink-50 text-pink-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          دسته‌بندی
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tags")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm transition ${
            activeTab === "tags"
              ? "bg-pink-50 text-pink-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          برچسب‌ها
        </button>
      </div>

      {activeTab === "categories" ? (
        <div className="mt-4 flex flex-col gap-3">
          <div className="relative">
            <select
              value={selectedCategory || ""}
              onChange={(e) =>
                onCategoryChange(e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full appearance-none rounded-xl border border-slate-100 bg-white px-4 py-3 pr-10 text-xs text-neutral-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            >
              <option value="">انتخاب دسته بندی</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.Name || category.Title}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {showAddCategoryForm && onAddCategory && (
            <div className="flex flex-col gap-3 rounded-xl border border-slate-100 p-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="نام دسته بندی جدید"
                className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />

              <div className="relative">
                <select
                  value={parentCategoryId || ""}
                  onChange={(e) =>
                    setParentCategoryId(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full appearance-none rounded-xl border border-slate-100 bg-white px-4 py-2 pr-10 text-sm text-neutral-600 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                >
                  <option value="">دسته بندی مادر</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.Name || category.Title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <button
                type="button"
                onClick={handleAddCategory}
                disabled={isAddingCategory || !newCategoryName.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-pink-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAddingCategory ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <span>افزودن دسته بندی</span>
                )}
              </button>
            </div>
          )}

          {onAddCategory && !showAddCategoryForm && (
            <button
              type="button"
              onClick={() => setShowAddCategoryForm(true)}
              className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600"
            >
              <Plus className="h-4 w-4" />
              <span>افزودن دسته بندی جدید</span>
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <div className="relative">
            <select
              value=""
              onChange={(e) => {
                handleTagSelect(e.target.value);
                e.currentTarget.selectedIndex = 0;
              }}
              className="w-full appearance-none rounded-xl border border-slate-100 bg-white px-4 py-3 pr-10 text-xs text-neutral-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            >
              <option value="">انتخاب برچسب</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id} disabled={selectedTags.includes(tag.id)}>
                  {tag.Name}
                </option>
              ))}
            </select>
            <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {selectedTagObjects.length > 0 && (
            <div className="rounded-xl border border-slate-100 p-3">
              <div className="flex flex-wrap gap-2">
                {selectedTagObjects.map((tag) => (
                  <span
                    key={tag.id}
                    className="flex items-center gap-1 rounded bg-slate-100 px-3 py-1 text-xs text-slate-500"
                  >
                    <span>{tag.Name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag.id)}
                      className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-slate-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {showAddTagForm && onAddTag && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="نام برچسب جدید"
                className="flex-1 rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={isAddingTag || !newTagName.trim()}
                className="flex items-center justify-center rounded-xl bg-pink-500 px-3 text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAddingTag ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </button>
            </div>
          )}

          {onAddTag && !showAddTagForm && (
            <button
              type="button"
              onClick={() => setShowAddTagForm(true)}
              className="flex items-center justify-end gap-1 text-xs text-pink-500 hover:text-pink-600"
            >
              <Plus className="h-4 w-4" />
              <span>افزودن برچسب جدید</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
