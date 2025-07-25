import React from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  rows?: number;
};

export default function MultilineTextField({
  value,
  onChange,
  readOnly,
  rows,
}: Props) {
  return (
    <textarea
      disabled={readOnly}
      readOnly={readOnly}
      rows={rows}
      className={`w-full border border-neutral-200 rounded-lg py-2 px-5 text-sm ${
        readOnly ? "bg-slate-100 text-slate-500" : ""
      }`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
