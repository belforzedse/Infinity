import React from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export default function TextField({ value, onChange, readOnly }: Props) {
  return (
    <input
      type="text"
      disabled={readOnly}
      readOnly={readOnly}
      className={`text-sm w-full rounded-lg border border-neutral-200 px-5 py-3 ${
        readOnly ? "text-slate-500" : ""
      }`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
