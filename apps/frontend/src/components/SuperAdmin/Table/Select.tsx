"use client";

import ChevronDownIcon from "@/components/Search/Icons/ChevronDownIcon";
import { cn } from "@/utils/tailwind";
import { useEffect, useState } from "react";

interface Option {
  id: string | number;
  title: string;
}

interface Props {
  options: Option[];
  className?: string;
  buttonClassName?: string;
  selectedOption?: string | number;
  iconClassName?: string;
  onOptionSelect?: (optionId: string | number) => void;
}

const SuperAdminTableSelect = ({
  options: filterOptions,
  onOptionSelect,
  className,
  buttonClassName,
  iconClassName,
  selectedOption: selectedOptionId,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option>({
    id: "",
    title: "",
  });

  useEffect(() => {
    setTimeout(() => {
      setSelectedOption(
        filterOptions.find((option) => +option.id === +(selectedOptionId || -1)) ||
          filterOptions.find((option) => option.id === selectedOptionId) ||
          filterOptions[0] || {
            id: "",
            title: "",
          },
      );
    }, 100);
  }, [filterOptions, selectedOptionId]);

  const handleOptionClick = (option: Option) => {
    setSelectedOption(option);
    onOptionSelect?.(option.id);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative rounded-lg border border-slate-100", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full min-w-0 items-center justify-between gap-2 rounded-xl bg-white px-3 py-2",
          buttonClassName,
        )}
      >
        <span className="min-w-0 truncate text-xs text-gray-800">{selectedOption.title}</span>
        <ChevronDownIcon
          className={cn("h-6 w-6 shrink-0 transition-transform", iconClassName, isOpen ? "rotate-180" : "")}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 max-w-[calc(100vw-2rem)] rounded-xl bg-white p-3 shadow-lg">
          <ul className="max-h-64 min-w-32 max-w-full space-y-2 overflow-y-auto">
            {filterOptions.map((option) => (
              <li key={option.id} className="w-full">
                <button
                  type="button"
                  onClick={() => handleOptionClick(option)}
                  className={`text-xs w-full min-w-0 rounded-lg px-2 py-1.5 text-right transition-colors hover:bg-stone-50 ${
                    selectedOption.id === option.id ? "text-primary bg-stone-50" : "text-gray-800"
                  }`}
                >
                  <span className="block truncate">{option.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SuperAdminTableSelect;
