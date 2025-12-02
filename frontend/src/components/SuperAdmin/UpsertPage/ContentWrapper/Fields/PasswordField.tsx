import React from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export default function PasswordField({ value, onChange, readOnly }: Props) {
  return (
    <input
      type="password"
      disabled={readOnly}
      readOnly={readOnly}
      className={`text-sm flex-1 rounded-lg border border-neutral-200 px-5 py-3 ${
        readOnly ? "text-slate-500" : ""
      }`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
