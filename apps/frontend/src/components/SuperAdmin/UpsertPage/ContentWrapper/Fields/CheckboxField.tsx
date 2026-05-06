import React from "react";

type Option = {
  label: string;
  value: string;
};

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
  options: Option[];
};

export default function CheckboxField({ value, onChange, options }: Props) {
  return (
    <div className="flex items-center gap-2 md:gap-8">
      {options.map((option) => (
        <div key={option.value} className="flex items-center gap-0.5 md:gap-2">
          <input
            type="checkbox"
            name={option.value}
            className="h-4 w-4 accent-actions-primary checked:bg-actions-primary checked:text-white"
            checked={value?.includes(option.value)}
            onChange={(e) => {
              const currentValues = [...(value || [])];
              if (e.target.checked) {
                if (!currentValues.includes(option.value)) {
                  currentValues.push(option.value);
                }
              } else {
                const index = currentValues.indexOf(option.value);
                if (index !== -1) {
                  currentValues.splice(index, 1);
                }
              }
              onChange(currentValues);
            }}
          />
          <span className="text-base text-neutral-600">{option.label}</span>
        </div>
      ))}
    </div>
  );
}
