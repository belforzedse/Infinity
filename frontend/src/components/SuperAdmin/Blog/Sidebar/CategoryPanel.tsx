"use client";

import React, { useState } from "react";
import { ChevronDown, FolderOpen, Plus } from "lucide-react";
import type { BlogCategory } from "@/services/blog/blog.service";

interface CategoryPanelProps {
  selectedCategory?: number;
  onCategoryChange: (categoryId: number | undefined) => void;
  categories: BlogCategory[];
  onAddCategory?: (name: string, parentId?: number) => Promise<void>;
}

export default function CategoryPanel({
  selectedCategory,
  onCategoryChange,
  categories,
  onAddCategory,
}: CategoryPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState<number | undefined>();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !onAddCategory) return;

    setIsAdding(true);
    try {
      await onAddCategory(newCategoryName.trim(), parentCategoryId);
      setNewCategoryName("");
      setParentCategoryId(undefined);
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
            <FolderOpen className="h-4 w-4 text-slate-500" />
          </div>
          <span className="text-sm font-medium text-neutral-800">دسته بندی</span>
        </div>
      </div>

      {/* Category Selector */}
      <div className="relative">
        <select
          value={selectedCategory || ""}
          onChange={(e) => onCategoryChange(e.target.value ? Number(e.target.value) : undefined)}
          className="w-full appearance-none rounded-xl border border-slate-100 bg-white px-4 py-3 pr-10 text-xs text-neutral-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
        >
          <option value="">انتخاب دسته بندی</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.Name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {/* Add New Category Form */}
      {showAddForm && onAddCategory && (
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
              onChange={(e) => setParentCategoryId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full appearance-none rounded-xl border border-slate-100 bg-white px-4 py-2 pr-10 text-sm text-neutral-600 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            >
              <option value="">دسته بندی مادر</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.Name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <button
            type="button"
            onClick={handleAddCategory}
            disabled={isAdding || !newCategoryName.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-pink-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAdding ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>افزودن دسته بندی</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Add Category Link */}
      {onAddCategory && !showAddForm && (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600"
        >
          <Plus className="h-4 w-4" />
          <span>افزودن دسته بندی جدید</span>
        </button>
      )}
    </div>
  );
}


