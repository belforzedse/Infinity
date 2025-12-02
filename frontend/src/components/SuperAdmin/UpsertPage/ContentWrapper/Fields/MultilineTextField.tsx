import React from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  rows?: number;
};

export default function MultilineTextField({ value, onChange, readOnly, rows }: Props) {
  return (
    <textarea
      disabled={readOnly}
      readOnly={readOnly}
      rows={rows}
      className={`text-sm w-full rounded-lg border border-neutral-200 px-5 py-2 ${
        readOnly ? "bg-slate-100 text-slate-500" : ""
      }`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
