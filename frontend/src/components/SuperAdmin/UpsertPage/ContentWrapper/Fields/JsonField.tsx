import React from "react";
import CopyIcon from "../../Icons/CopyIcon";

type Props = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  rows?: number;
};

export default function JsonField({
  value,
  onChange,
  readOnly,
  rows = 10,
}: Props) {
  return (
    <div className="border border-slate-100 rounded-lg">
      <div className="w-full bg-slate-50 py-2 px-5 flex items-center">
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
        className={`w-full py-2 px-5 text-sm ${
          readOnly ? "bg-slate-100 text-slate-500" : ""
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
