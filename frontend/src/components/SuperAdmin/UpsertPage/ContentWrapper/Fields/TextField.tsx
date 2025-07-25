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
      className={`w-full border border-neutral-200 rounded-lg py-3 px-5 text-sm ${
        readOnly ? " text-slate-500" : ""
      }`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
