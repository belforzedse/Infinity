"use client";

interface SlotTextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "color";
  placeholder?: string;
  inputClassName?: string;
  editorField?: string;
}

export function SlotTextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  inputClassName = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm",
  editorField,
}: SlotTextFieldProps) {
  return (
    <label className="text-xs text-slate-600">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === "color" ? e.target.value : e.target.value)}
        placeholder={placeholder}
        className={inputClassName}
        data-hero-editor-field={editorField}
      />
    </label>
  );
}
