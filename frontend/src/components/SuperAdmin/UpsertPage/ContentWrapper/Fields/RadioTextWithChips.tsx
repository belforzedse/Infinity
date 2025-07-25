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
          <div
            key={option.value}
            className="flex items-center gap-0.5 md:gap-2"
          >
            <input
              value={option.value}
              checked={value === option.value}
              onChange={() => onValueChange(option.value)}
              type="radio"
              name={name}
              className="w-4 h-4 accent-actions-primary checked:bg-actions-primary checked:text-white"
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
                      "px-2 py-1 bg-slate-50 rounded-md border text-gray-400 border-slate-200",
                      chip.value === chipsValue
                        ? "bg-pink-50 text-actions-primary border-actions-primary"
                        : ""
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
        className={`w-full border border-neutral-200 rounded-lg py-2 px-5 text-sm`}
        placeholder={descriptionPlaceholder}
        value={textValue}
        onChange={(e) => onTextChange(e.target.value)}
      />
    </div>
  );
}
