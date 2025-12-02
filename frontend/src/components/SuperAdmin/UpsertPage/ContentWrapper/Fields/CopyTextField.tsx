import React from "react";
import CopyIcon from "../../Icons/CopyIcon";

type Props = {
  value: string | null | undefined;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export default function CopyTextField({ value, onChange, readOnly }: Props) {
  const safeValue = value ?? "";

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(safeValue);
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }
    } else {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = safeValue;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="flex w-full items-center gap-2 rounded-lg border border-neutral-200 px-5 py-3">
      <button
        className="flex h-5 w-5 items-center justify-center"
        onClick={handleCopy}
      >
        <CopyIcon />
      </button>

      <input
        type="text"
        dir="ltr"
        className={`text-sm flex-1 ${readOnly ? "text-slate-500" : ""}`}
        disabled={readOnly}
        readOnly={readOnly}
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
