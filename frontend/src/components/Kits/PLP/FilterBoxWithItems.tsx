"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import CheckIcon from "../Icons/CheckIcon";
import SearchIcon from "../Icons/SearchIcon";

const MotionDiv = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.div),
  { ssr: false },
);
const AnimatePresence = dynamic(
  () => import("framer-motion").then((mod) => mod.AnimatePresence),
  { ssr: false },
);

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
  const [hasAnimated, setHasAnimated] = useState(defaultOpen);
  const [searchQuery, setSearchQuery] = useState("");
  const [localOptions, setLocalOptions] =
    useState<FilterOption[]>(initialOptions);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    setLocalOptions(initialOptions);
  }, [initialOptions]);

  const filteredOptions = localOptions.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()),
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
      }),
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
    <div className="rounded-2xl bg-stone-50 p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (!hasAnimated) {
              setHasAnimated(true);
            }
            setIsOpen((prev) => !prev);
          }}
          className="flex w-full flex-row-reverse items-center justify-between gap-x-[81px]"
        >
          <div className="flex h-5 w-5 items-center justify-center">
            <span className="text-primary text-2xl font-light !leading-none">
              {isOpen ? "-" : "+"}
            </span>
          </div>
          <span className="text-primary text-sm font-normal">{title}</span>
        </button>
      </div>
      {hasAnimated && (
        <AnimatePresence>
          {isOpen && (
            <MotionDiv
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 overflow-hidden"
            >
              <div className="rounded-lg bg-white">
                {hasSearch && (
                  <>
                  <div className="flex items-center justify-between border-b border-slate-50 p-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={inputPlaceholder}
                      className="text-xs flex-grow bg-transparent text-right text-neutral-400 outline-none"
                    />
                    <div className="h-5 w-5">
                      <SearchIcon />
                    </div>
                  </div>
                  <div className="h-[1px] bg-slate-50" />
                </>
              )}
              <div
                className="scrollbar-thumb-primary max-h-[200px] overflow-y-auto px-2 scrollbar-thin scrollbar-track-slate-50"
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
                      <div className="flex flex-row-reverse items-center justify-end gap-2 py-2">
                        <span className="text-primary text-sm">
                          {option.label}
                        </span>
                        <div
                          className="relative"
                          onClick={() => handleOptionClick(option.id)}
                        >
                          {selectedOptions.includes(option.id) ? (
                            <CheckIcon className="h-4 w-4 rounded" />
                          ) : (
                            <div className="border-gray-4 h-4 w-4 cursor-pointer appearance-none rounded border" />
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
              {/* Close rounded container */}
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default PLPFilterBoxWithItems;
