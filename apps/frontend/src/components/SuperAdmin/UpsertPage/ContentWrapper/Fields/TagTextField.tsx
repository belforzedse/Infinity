import React from "react";

type Option = {
  label: string;
  value: string;
};

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
  options?: Option[];
};

export default function TagTextField({ value, onChange, options }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 rounded-lg border border-neutral-200 p-2">
        {value &&
          Array.isArray(value) &&
          value.map((tag, index) => {
            const option = options?.find((opt) => opt.value === tag);
            return (
              <div
                key={index}
                className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-500"
              >
                <span className="text-sm">{option?.label || tag}</span>
                <button
                  type="button"
                  className="text-slate-500 hover:text-slate-700"
                  onClick={() => {
                    const newTags = [...value];
                    newTags.splice(index, 1);
                    onChange(newTags);
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        <input
          type="text"
          className="min-w-[100px] flex-grow border-none outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value.trim()) {
              e.preventDefault();
              const inputValue = e.currentTarget.value.trim();
              const option = options?.find(
                (opt) =>
                  opt.value === inputValue || opt.label.toLowerCase() === inputValue.toLowerCase(),
              );
              const tagValue = option?.value || inputValue;

              if (!value.includes(tagValue)) {
                onChange([...value, tagValue]);
              }
              e.currentTarget.value = "";
            }
          }}
        />
      </div>
    </div>
  );
}
