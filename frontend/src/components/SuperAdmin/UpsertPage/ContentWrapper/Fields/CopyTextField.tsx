import React from "react";
import CopyIcon from "../../Icons/CopyIcon";

type Props = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export default function CopyTextField({ value, onChange, readOnly }: Props) {
  return (
    <div className="w-full border border-neutral-200 rounded-lg flex items-center gap-2 py-3 px-5">
      <button
        className="w-5 h-5 flex items-center justify-center"
        onClick={(e) => {
          e.preventDefault();
          navigator.clipboard.writeText(value);
        }}
      >
        <CopyIcon />
      </button>

      <input
        type="text"
        dir="ltr"
        className={`flex-1 text-sm ${readOnly ? "text-slate-500" : ""}`}
        disabled={readOnly}
        readOnly={readOnly}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
