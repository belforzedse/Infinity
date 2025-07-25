"use client";

import ChevronDownIcon from "@/components/Search/Icons/ChevronDownIcon";
import { useEffect, useState } from "react";

interface CategoryOption {
  id: string | number;
  title: string;
}

interface Props {
  title: string;
  value: string;
  filterOptions: CategoryOption[];
  onOptionSelect?: (optionId: string | number) => void;
  isLoading?: boolean;
}

const PLPListFilterCategory = ({
  title,
  value,
  filterOptions,
  onOptionSelect,
  isLoading = false,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<CategoryOption>(
    filterOptions[0] || { id: "", title: "" }
  );

  useEffect(() => {
    setSelectedOption(
      filterOptions.find((option) => option.id === value) || {
        id: "",
        title: "",
      }
    );
  }, [value, filterOptions]);

  const handleOptionClick = (option: CategoryOption) => {
    setSelectedOption(option);
    onOptionSelect?.(option.id);
    setIsOpen(false);
  };

  return (
    <div className="bg-stone-50 rounded-2xl p-4 rtl">
      <div className="flex items-center justify-between pb-3">
        <h3 className="text-sm text-primary">{title}</h3>
      </div>

      <div className="mt-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-white rounded-xl px-3 py-2"
          disabled={isLoading}
        >
          <span className="text-gray-800 text-xs">
            {isLoading ? "در حال بارگذاری..." : selectedOption.title}
          </span>
          <ChevronDownIcon
            className={`w-6 h-6 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && !isLoading && (
          <div className="mt-2 bg-white rounded-xl p-3">
            <ul className="space-y-2">
              {filterOptions.map((option) => (
                <li key={option.id}>
                  <button
                    onClick={() => handleOptionClick(option)}
                    className={`w-full text-right text-xs px-2 py-1.5 rounded-lg hover:bg-stone-50 transition-colors ${
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
    </div>
  );
};

export default PLPListFilterCategory;
