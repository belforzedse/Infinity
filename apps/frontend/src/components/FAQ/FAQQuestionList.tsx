"use client";

import { useState, useEffect } from "react";
import { FAQCategory, FAQQuestion } from "@/types/faq";
import FAQQuestionItem from "./FAQQuestionItem";
import { X } from "lucide-react";

interface FAQQuestionListProps {
  categories: FAQCategory[];
  defaultCategory?: FAQCategory | null;
  selectedCategoryId?: number | null;
  onCategoryChange?: (categoryId: number | null) => void;
}

export default function FAQQuestionList({
  categories,
  defaultCategory,
  selectedCategoryId: externalSelectedCategoryId,
  onCategoryChange,
}: FAQQuestionListProps) {
  const [internalSelectedCategoryId, setInternalSelectedCategoryId] =
    useState<number | null>(defaultCategory?.id || null);
  const [showSupportMessage, setShowSupportMessage] = useState(true);

  // Use external selectedCategoryId if provided, otherwise use internal state
  const selectedCategoryId =
    externalSelectedCategoryId !== undefined
      ? externalSelectedCategoryId
      : internalSelectedCategoryId;

  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId
  );

  const questions: FAQQuestion[] =
    selectedCategory?.faq_questions?.filter((q) => q.IsActive) || [];

  // Sort questions by Order
  const sortedQuestions = [...questions].sort((a, b) => {
    const orderA = a.Order || 0;
    const orderB = b.Order || 0;
    return orderA - orderB;
  });

  // Update selected category when defaultCategory changes (only if no external control)
  useEffect(() => {
    if (
      externalSelectedCategoryId === undefined &&
      defaultCategory &&
      !internalSelectedCategoryId
    ) {
      setInternalSelectedCategoryId(defaultCategory.id);
    }
  }, [
    defaultCategory,
    internalSelectedCategoryId,
    externalSelectedCategoryId,
  ]);

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center">
        <p className="text-neutral-600">در حال حاضر سوالی وجود ندارد.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Support Message Banner */}
      {showSupportMessage && (
        <div className="relative rounded-xl bg-infinity-primary-lighter/20 p-4 pr-10">
          <button
            type="button"
            onClick={() => setShowSupportMessage(false)}
            className="absolute right-2 top-2 text-infinity-primary hover:text-infinity-primary"
            aria-label="بستن پیام"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-sm text-infinity-primary-dark">
            اگر باز هم سوالی داشتید، تیم پشتیبانی ما همیشه آماده راهنمایی هست.
          </p>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-3">
        {sortedQuestions.length > 0 ? (
          sortedQuestions.map((question, index) => (
            <FAQQuestionItem
              key={question.id}
              question={question}
              defaultOpen={index === 0}
            />
          ))
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-neutral-600">
              در حال حاضر سوالی در این دسته‌بندی وجود ندارد.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
