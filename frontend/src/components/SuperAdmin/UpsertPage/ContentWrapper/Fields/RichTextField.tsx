"use client";

import React from "react";
import RichTextEditor from "@/components/RichTextEditor";

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
