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
    filterOptions[0] || { id: "", title: "" },
  );

  useEffect(() => {
    setSelectedOption(
      filterOptions.find((option) => option.id === value) || {
        id: "",
        title: "",
      },
    );
  }, [value, filterOptions]);

  const handleOptionClick = (option: CategoryOption) => {
    setSelectedOption(option);
    onOptionSelect?.(option.id);
    setIsOpen(false);
  };

  return (
    <div className="rtl rounded-2xl bg-stone-50 p-4">
      <div className="flex items-center justify-between pb-3">
        <h3 className="text-primary text-sm">{title}</h3>
      </div>

      <div className="mt-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2"
          disabled={isLoading}
        >
          <span className="text-xs text-gray-800">
            {isLoading ? "در حال بارگذاری..." : selectedOption.title}
          </span>
          <ChevronDownIcon
            className={`h-6 w-6 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && !isLoading && (
          <div className="mt-2 rounded-xl bg-white p-3">
            <ul className="space-y-2">
              {filterOptions.map((option) => (
                <li key={option.id}>
                  <button
                    onClick={() => handleOptionClick(option)}
                    className={`text-xs w-full rounded-lg px-2 py-1.5 text-right transition-colors hover:bg-stone-50 ${
                      selectedOption.id === option.id
                        ? "text-primary bg-stone-50"
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
