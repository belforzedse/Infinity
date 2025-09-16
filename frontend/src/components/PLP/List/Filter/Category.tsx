"use client";

import ChevronDownIcon from "@/components/Search/Icons/ChevronDownIcon";
import React, { useEffect, useState } from "react";

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
  placeholder?: string;
}

const PLPListFilterCategory = ({
  title,
  value,
  filterOptions,
  onOptionSelect,
  isLoading = false,
  placeholder = "انتخاب دسته بندی",
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<CategoryOption>(
    filterOptions[0] || { id: "", title: "" },
  );
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

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
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (isLoading) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    if (e.key === "Escape") {
      setIsOpen(false);
      setFocusedIndex(-1);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((idx) => Math.min(idx + 1, filterOptions.length - 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((idx) => Math.max(idx - 1, 0));
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const option = filterOptions[focusedIndex];
      if (option) handleOptionClick(option);
    }
  };

  const placeholderText = placeholder;

  return (
    <div className="rtl rounded-2xl bg-stone-50 p-4">
      <div className="flex items-center justify-between pb-3">
        <h3 className="text-primary text-sm">{title}</h3>
      </div>

      <div className="mt-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2"
          disabled={isLoading}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="text-xs">
            {isLoading ? (
              "در حال بارگذاری..."
            ) : selectedOption?.title ? (
              <span className="text-gray-800">{selectedOption.title}</span>
            ) : (
              // Placeholder shown when no category is selected
              <span className="text-gray-400">{placeholderText}</span>
            )}
          </span>
          <ChevronDownIcon
            className={`h-6 w-6 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && !isLoading && (
          <div className="mt-2 rounded-xl bg-white p-3">
            <ul className="space-y-2" role="listbox" aria-label={title}>
              {filterOptions.map((option, idx) => (
                <li key={option.id}>
                  <button
                    onClick={() => handleOptionClick(option)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className={`text-xs w-full rounded-lg px-2 py-1.5 text-right transition-colors hover:bg-stone-50 ${
                      selectedOption.id === option.id
                        ? "text-primary bg-stone-50"
                        : "text-gray-800"
                    } ${focusedIndex === idx ? "ring-primary/30 ring-2" : ""}`}
                    role="option"
                    aria-selected={selectedOption.id === option.id}
                    tabIndex={-1}
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
