import React from "react";
import { twMerge } from "tailwind-merge";

type Chip = {
  label: string;
  value: string;
};

type Option = {
  label: string;
  value: string;
  chips?: Chip[];
};

type Props = {
  name: string;
  value: string;
  chipsValue: string;
  textValue: string;
  descriptionPlaceholder: string;
  options: Option[];
  onValueChange: (value: string) => void;
  onChipsChange: (value: string) => void;
  onTextChange: (value: string) => void;
};

export default function RadioTextWithChips({
  name,
  value,
  chipsValue,
  textValue,
  descriptionPlaceholder,
  options,
  onValueChange,
  onChipsChange,
  onTextChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 md:gap-8">
        {options.map((option) => (
          <div key={option.value} className="flex items-center gap-0.5 md:gap-2">
            <input
              value={option.value}
              checked={value === option.value}
              onChange={() => onValueChange(option.value)}
              type="radio"
              name={name}
              className="h-4 w-4 accent-actions-primary checked:bg-actions-primary checked:text-white"
            />
            <span className="text-base text-neutral-600">{option.label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {(() => {
          const selectedOption = options.find((item) => item.value === value);

          return selectedOption && selectedOption.chips
            ? selectedOption.chips.map((chip) => (
                <div key={chip.value}>
                  <button
                    className={twMerge(
                      "rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-gray-400",
                      chip.value === chipsValue
                        ? "border-actions-primary bg-pink-50 text-actions-primary"
                        : "",
                    )}
                    onClick={() => onChipsChange(chip.value)}
                  >
                    <span className="text-sm">{chip.label}</span>
                  </button>
                </div>
              ))
            : null;
        })()}
      </div>

      <textarea
        rows={6}
        className={`text-sm w-full rounded-lg border border-neutral-200 px-5 py-2`}
        placeholder={descriptionPlaceholder}
        value={textValue}
        onChange={(e) => onTextChange(e.target.value)}
      />
    </div>
  );
}
