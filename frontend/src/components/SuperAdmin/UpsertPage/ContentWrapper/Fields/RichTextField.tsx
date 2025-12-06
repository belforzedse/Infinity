"use client";

import React from "react";
import dynamic from "next/dynamic";

// Lazy load RichTextEditor to reduce initial bundle size
const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[200px] w-full animate-pulse rounded-lg border border-gray-200 bg-gray-50" />
  ),
});

interface RichTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  label?: string;
  placeholder?: string;
  helper?: React.ReactNode;
}

const RichTextField: React.FC<RichTextFieldProps> = ({
  value,
  onChange,
  readOnly = false,
  label,
  placeholder,
  helper,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-neutral-600">
          {label}
        </label>
      )}

      <RichTextEditor
        content={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
      />

      {helper && (
        <div className="text-sm text-neutral-500">
          {helper}
        </div>
      )}
    </div>
  );
};

export default RichTextField;
