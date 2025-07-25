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
      className={`flex-1 border border-neutral-200 rounded-lg py-3 px-5 text-sm ${
        readOnly ? "text-slate-500" : ""
      }`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
