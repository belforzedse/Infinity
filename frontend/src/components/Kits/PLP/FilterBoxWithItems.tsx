"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CheckIcon from "../Icons/CheckIcon";
import SearchIcon from "../Icons/SearchIcon";

interface FilterOption {
  id: string;
  label: string;
  checked?: boolean;
}

interface Props {
  title: string;
  inputPlaceholder?: string;
  options: FilterOption[];
  defaultOpen?: boolean;
  hasSearch?: boolean;
  onOptionChange?: (option: FilterOption) => void;
  onOptionSelect?: (optionId: string) => void;
}

const PLPFilterBoxWithItems = ({
  title,
  options: initialOptions,
  defaultOpen = false,
  hasSearch = false,
  inputPlaceholder = "سرچ کنین",
  onOptionChange,
  onOptionSelect,
}: Props) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [searchQuery, setSearchQuery] = useState("");
  const [localOptions, setLocalOptions] =
    useState<FilterOption[]>(initialOptions);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    setLocalOptions(initialOptions);
  }, [initialOptions]);

  const filteredOptions = localOptions.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCheckboxChange = (optionId: string) => {
    setLocalOptions((prevOptions) =>
      prevOptions.map((opt) => {
        if (opt.id === optionId) {
          const updatedOption = { ...opt, checked: !opt.checked };
          onOptionChange?.(updatedOption);
          return updatedOption;
        }
        return opt;
      })
    );
  };

  const handleOptionClick = (optionId: string) => {
    const newSelectedOptions = selectedOptions.includes(optionId)
      ? selectedOptions.filter((id) => id !== optionId)
      : [...selectedOptions, optionId];

    setSelectedOptions(newSelectedOptions);
    onOptionSelect?.(optionId);
  };

  return (
    <div className="bg-stone-50 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-row-reverse items-center gap-x-[81px] w-full justify-between"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <span className="text-2xl !leading-none text-primary font-light">
              {isOpen ? "-" : "+"}
            </span>
          </div>
          <span className="text-sm font-normal text-primary">{title}</span>
        </button>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 overflow-hidden"
          >
            <div className="bg-white rounded-lg">
              {hasSearch && (
                <>
                  <div className="flex justify-between items-center border-b border-slate-50 p-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={inputPlaceholder}
                      className="text-xs text-neutral-400 text-right flex-grow outline-none bg-transparent"
                    />
                    <div className="w-5 h-5">
                      <SearchIcon />
                    </div>
                  </div>
                  <div className="h-[1px] bg-slate-50" />
                </>
              )}
              <div
                className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-slate-50 px-2"
                style={
                  {
                    scrollbarWidth: "thin",
                    scrollbarColor: "#EC4899 #F8FAFC",
                  } as React.CSSProperties
                }
              >
                <div className="flex flex-col py-2">
                  {filteredOptions.map((option, index) => (
                    <div key={option.id}>
                      <div className="flex flex-row-reverse items-center justify-end gap-2  py-2">
                        <span className="text-sm text-primary">
                          {option.label}
                        </span>
                        <div
                          className="relative"
                          onClick={() => handleOptionClick(option.id)}
                        >
                          {selectedOptions.includes(option.id) ? (
                            <CheckIcon className="w-4 h-4 rounded" />
                          ) : (
                            <div className="w-4 h-4 border border-gray-4 rounded appearance-none cursor-pointer" />
                          )}
                        </div>
                      </div>
                      {index < filteredOptions.length - 1 && (
                        <div className="h-[1px] bg-slate-50" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PLPFilterBoxWithItems;
