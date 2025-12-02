import React from "react";
import CopyIcon from "../../Icons/CopyIcon";

type Props = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  rows?: number;
};

export default function JsonField({ value, onChange, readOnly, rows = 10 }: Props) {
  return (
    <div className="rounded-lg border border-slate-100">
      <div className="flex w-full items-center bg-slate-50 px-5 py-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            navigator.clipboard.writeText(value);
          }}
        >
          <CopyIcon />
        </button>
      </div>
      <textarea
        dir="ltr"
        disabled={readOnly}
        readOnly={readOnly}
        rows={rows}
        className={`text-sm w-full px-5 py-2 ${readOnly ? "bg-slate-100 text-slate-500" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
