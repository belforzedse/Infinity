import React from "react";

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const normalizeHex = (value: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) return trimmed;
  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return trimmed.toLowerCase();
};

type Props = {
  value?: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  helper?: React.ReactNode;
};

export default function ColorField({ value = "", onChange, readOnly, placeholder, helper }: Props) {
  const normalized = normalizeHex(value);
  const safeColor = HEX_COLOR_REGEX.test(normalized) ? normalized : "#ffffff";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2 py-2">
          <input
            type="color"
            value={safeColor}
            disabled={readOnly}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-10 cursor-pointer rounded-md border border-neutral-200"
            aria-label="انتخاب رنگ"
          />
          <div
            className="h-9 w-9 rounded-md border border-neutral-200"
            style={{ backgroundColor: safeColor }}
            aria-hidden="true"
          />
        </div>

        <input
          type="text"
          value={value}
          disabled={readOnly}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`text-sm w-full rounded-lg border border-neutral-200 px-4 py-3 tracking-wide ${
            readOnly ? "text-slate-500" : ""
          }`}
        />
      </div>

      {helper && <div className="text-xs text-slate-500">{helper}</div>}
    </div>
  );
}
