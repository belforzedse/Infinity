"use client";

import { useState } from "react";
import { FAQQuestion } from "@/types/faq";
import { Plus, X } from "lucide-react";

interface FAQQuestionItemProps {
  question: FAQQuestion;
  defaultOpen?: boolean;
}

export default function FAQQuestionItem({
  question,
  defaultOpen = false,
}: FAQQuestionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-right transition-colors hover:bg-slate-50"
      >
        <span className="flex-1 text-sm font-medium text-neutral-900">
          {question.Question}
        </span>
        <div className="mr-3 flex-shrink-0">
          {isOpen ? (
            <X className="h-5 w-5 text-infinity-primary" />
          ) : (
            <Plus className="h-5 w-5 text-infinity-primary" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="border-t border-slate-200 px-4 pb-4 pt-3">
          <div
            className="text-sm leading-relaxed text-neutral-600 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: question.Answer }}
          />
        </div>
      )}
    </div>
  );
}
