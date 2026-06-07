"use client";

import { useState } from "react";
import { FAQCategory } from "@/types/faq";
import { HelpCircle } from "lucide-react";

interface FAQCategorySidebarProps {
  categories: FAQCategory[];
  selectedCategoryId?: number | null;
  onCategorySelect?: (categoryId: number | null) => void;
}

export default function FAQCategorySidebar({
  categories,
  selectedCategoryId,
  onCategorySelect,
}: FAQCategorySidebarProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(
    selectedCategoryId || (categories.length > 0 ? categories[0].id : null)
  );

  const handleCategoryClick = (categoryId: number) => {
    const newActiveId = activeCategoryId === categoryId ? null : categoryId;
    setActiveCategoryId(newActiveId);
    onCategorySelect?.(newActiveId);
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">
        دسته‌بندی‌ها
      </h2>
      <nav className="space-y-2">
        {categories.map((category) => {
          const isActive = activeCategoryId === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryClick(category.id)}
              className={`w-full rounded-lg px-4 py-3 text-right transition-colors ${
                isActive
                  ? "bg-infinity-primary text-white"
                  : "bg-slate-50 text-neutral-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{category.Title}</span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
