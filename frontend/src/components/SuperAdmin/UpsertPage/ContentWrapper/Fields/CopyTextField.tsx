import React from "react";
import CopyIcon from "../../Icons/CopyIcon";

type Props = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export default function CopyTextField({ value, onChange, readOnly }: Props) {
  return (
    <div className="flex w-full items-center gap-2 rounded-lg border border-neutral-200 px-5 py-3">
      <button
        className="flex h-5 w-5 items-center justify-center"
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
        className={`text-sm flex-1 ${readOnly ? "text-slate-500" : ""}`}
        disabled={readOnly}
        readOnly={readOnly}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
