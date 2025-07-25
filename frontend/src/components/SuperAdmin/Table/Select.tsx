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

  console.log(selectedOptionId, filterOptions);

  useEffect(() => {
    setTimeout(() => {
      setSelectedOption(
        filterOptions.find(
          (option) => +option.id === +(selectedOptionId || -1)
        ) ||
          filterOptions.find((option) => option.id === selectedOptionId) ||
          filterOptions[0] || {
            id: "",
            title: "",
          }
      );
    }, 100);
  }, [filterOptions, selectedOptionId]);

  const handleOptionClick = (option: Option) => {
    setSelectedOption(option);
    onOptionSelect?.(option.id);
    setIsOpen(false);
  };

  return (
    <div
      className={cn("border border-slate-100 rounded-lg relative", className)}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between bg-white rounded-xl px-3 py-2",
          buttonClassName
        )}
      >
        <span className="text-gray-800 text-xs">{selectedOption.title}</span>
        <ChevronDownIcon
          className={cn(
            "w-6 h-6 transition-transform",
            iconClassName,
            isOpen ? "rotate-180" : ""
          )}
        />
      </button>

      {isOpen && (
        <div className="mt-2 bg-white rounded-xl p-3 absolute top-full right-0 w-fit">
          <ul className="space-y-2 w-fit">
            {filterOptions.map((option) => (
              <li key={option.id} className="w-full">
                <button
                  onClick={() => handleOptionClick(option)}
                  className={`w-full text-right text-xs px-2 py-1.5 rounded-lg hover:bg-stone-50 transition-colors text-nowrap ${
                    selectedOption.id === option.id
                      ? "bg-stone-50 text-primary"
                      : "text-gray-800"
                  }`}
                >
                  {option.title}
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
