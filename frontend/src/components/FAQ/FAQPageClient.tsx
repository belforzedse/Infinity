"use client";

import { useState } from "react";
import { FAQCategory } from "@/types/faq";
import FAQCategorySidebar from "@/components/FAQ/FAQCategorySidebar";
import FAQQuestionList from "@/components/FAQ/FAQQuestionList";

interface FAQPageClientProps {
  categories: FAQCategory[];
  defaultCategory: FAQCategory | null;
}

export default function FAQPageClient({
  categories,
  defaultCategory,
}: FAQPageClientProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    defaultCategory?.id || null
  );

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      {/* Category Sidebar - Right Side */}
      <aside className="w-full lg:w-64 lg:flex-shrink-0">
        <FAQCategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={setSelectedCategoryId}
        />
      </aside>

      {/* Questions List - Left Side */}
      <div className="flex-1">
        <FAQQuestionList
          categories={categories}
          defaultCategory={defaultCategory}
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={setSelectedCategoryId}
        />
      </div>
    </div>
  );
}
