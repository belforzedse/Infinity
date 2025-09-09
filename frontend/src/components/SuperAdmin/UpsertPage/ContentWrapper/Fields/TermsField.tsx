import React, { ReactNode, useState, useEffect, useRef } from "react";
import BluePlusIcon from "../../Icons/BluePlusIcon";

type Option = {
  label: string;
  value: string;
};

type Term = {
  category: string;
  tags: string[];
  tagLabels?: Record<string, string>; // Store labels for each tag value
};

type Props = {
  value: Term[];
  onChange: (value: Term[]) => void;
  options?: Option[];
  termTags?: Option[];
  helper?: ReactNode;
  readOnly?: boolean;
  fetchTerms?: (searchTerm: string, category: string) => Promise<Option[]>;
};

export default function TermsField({
  value,
  onChange,
  options = [],
  termTags = [],
  helper,
  readOnly,
  fetchTerms,
}: Props) {
  // Use separate state for each term's search input
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(-1);
  const [activeTermIndex, setActiveTermIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Initialize searchTerms when value changes
  useEffect(() => {
    if (value && value.length > 0) {
      // Initialize searchTerms array with empty strings for each term
      const initialSearchTerms = value.map(() => "");
      setSearchTerms(initialSearchTerms);
    }
  }, [value]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setActiveTermIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch suggestions when search term changes
  useEffect(() => {
    if (activeTermIndex === null || !fetchTerms) return;

    const fetchSuggestions = async () => {
      const searchTerm = searchTerms[activeTermIndex] || "";
      const category = value[activeTermIndex]?.category || "";

      if (searchTerm.trim().length < 2 && !category) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await fetchTerms(searchTerm, category);

        // Filter out already selected tags from suggestions
        const currentTags = value[activeTermIndex]?.tags || [];
        const filteredResults = results.filter(
          (option) => !currentTags.includes(option.value),
        );

        setSuggestions(filteredResults);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching terms:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerms, activeTermIndex, fetchTerms, value]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    itemIndex: number,
  ) => {
    const newSearchTerms = [...searchTerms];
    newSearchTerms[itemIndex] = e.target.value;
    setSearchTerms(newSearchTerms);
    setActiveItemIndex(-1);
    setActiveTermIndex(itemIndex);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    itemIndex: number,
  ) => {
    // Only handle arrow keys and escape for navigation
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveItemIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveItemIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
    // Removed the Enter key handling to prevent adding chips by typing
  };

  const addTag = (tagValue: string, tagLabel: string, itemIndex: number) => {
    if (!value[itemIndex]?.tags?.includes(tagValue)) {
      const updatedTerms = [...value];

      // Create or update the tagLabels object
      const tagLabels = {
        ...(updatedTerms[itemIndex]?.tagLabels || {}),
        [tagValue]: tagLabel,
      };

      updatedTerms[itemIndex] = {
        ...updatedTerms[itemIndex],
        tags: [...(updatedTerms[itemIndex]?.tags || []), tagValue],
        tagLabels: tagLabels,
      };

      onChange(updatedTerms);
    }
  };

  const selectSuggestion = (option: Option, itemIndex: number) => {
    addTag(option.value, option.label, itemIndex);

    // Clear only the current term's search input
    const newSearchTerms = [...searchTerms];
    newSearchTerms[itemIndex] = "";
    setSearchTerms(newSearchTerms);

    setSuggestions([]);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    itemIndex: number,
  ) => {
    const updatedTerms = [...value];
    updatedTerms[itemIndex] = {
      ...updatedTerms[itemIndex],
      category: e.target.value,
      // Clear tags when category changes
      tags: [],
      tagLabels: {}, // Also clear tag labels
    };
    onChange(updatedTerms);

    // Clear search and suggestions when category changes
    const newSearchTerms = [...searchTerms];
    newSearchTerms[itemIndex] = "";
    setSearchTerms(newSearchTerms);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSearchFocus = async (itemIndex: number) => {
    setActiveTermIndex(itemIndex);

    // Fetch initial suggestions based on the selected category
    if (fetchTerms && value[itemIndex]?.category) {
      setIsLoading(true);
      try {
        const results = await fetchTerms("", value[itemIndex].category);

        // Filter out already selected tags from suggestions
        const currentTags = value[itemIndex]?.tags || [];
        const filteredResults = results.filter(
          (option) => !currentTags.includes(option.value),
        );

        setSuggestions(filteredResults);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching terms:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Helper function to get tag label
  const getTagLabel = (tagValue: string, itemIndex: number): string => {
    // First check if we have a stored label
    const storedLabel = value[itemIndex]?.tagLabels?.[tagValue];
    if (storedLabel) return storedLabel;

    // Then try to find in termTags
    const termTag = termTags.find((opt) => opt.value === tagValue);
    if (termTag) return termTag.label;

    // Then try to find in suggestions
    const suggestion = suggestions.find((opt) => opt.value === tagValue);
    if (suggestion) return suggestion.label;

    // If not found, return the value itself
    return tagValue;
  };

  return (
    <div className="flex flex-col gap-10 md:gap-2">
      {value?.map((item, itemIndex) => (
        <div
          className="flex w-full flex-col gap-2 md:flex-row md:gap-4"
          key={itemIndex}
        >
          <div className="w-full md:w-1/2">
            <div className="overflow-hidden rounded-lg border border-neutral-200">
              <select
                className={`text-sm w-full border-l-[20px] border-transparent px-5 py-3 ${
                  readOnly ? "bg-slate-100 text-slate-500" : ""
                }`}
                disabled={readOnly}
                value={item?.category}
                onChange={(e) => handleCategoryChange(e, itemIndex)}
              >
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {helper && itemIndex === 0 && (
              <div className="w-full">{helper}</div>
            )}
          </div>
          <div className="w-full md:w-1/2">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2 rounded-lg border border-neutral-200 p-2">
                {Array.isArray(item?.tags) &&
                  item?.tags.map((tag: string, index: number) => {
                    // Get the label for the tag
                    const tagLabel = getTagLabel(tag, itemIndex);

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-500"
                      >
                        <span className="text-sm">{tagLabel}</span>
                        <button
                          type="button"
                          className="text-slate-500 hover:text-slate-700"
                          onClick={() => {
                            const updatedTerms = [...value];
                            const newTags = [...item.tags];
                            newTags.splice(index, 1);

                            // Also remove the label from tagLabels
                            const newTagLabels = { ...item.tagLabels };
                            delete newTagLabels[tag];

                            updatedTerms[itemIndex] = {
                              ...updatedTerms[itemIndex],
                              tags: newTags,
                              tagLabels: newTagLabels,
                            };
                            onChange(updatedTerms);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                <div className="relative min-w-[100px] flex-grow">
                  <input
                    ref={inputRef}
                    type="text"
                    className="w-full border-none outline-none"
                    value={searchTerms[itemIndex] || ""}
                    onChange={(e) => handleInputChange(e, itemIndex)}
                    onFocus={() => handleSearchFocus(itemIndex)}
                    onKeyDown={(e) => handleKeyDown(e, itemIndex)}
                    placeholder="جستجو و انتخاب از لیست..."
                    disabled={readOnly || !item?.category}
                  />

                  {showSuggestions &&
                    activeTermIndex === itemIndex &&
                    (suggestions.length > 0 || isLoading) && (
                      <div
                        ref={suggestionsRef}
                        className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-md"
                      >
                        {isLoading ? (
                          <div className="p-2 text-center text-gray-500">
                            در حال بارگذاری...
                          </div>
                        ) : (
                          suggestions.map((option, index) => (
                            <div
                              key={option.value}
                              className={`cursor-pointer p-2 hover:bg-gray-100 ${
                                index === activeItemIndex ? "bg-gray-100" : ""
                              }`}
                              onClick={() =>
                                selectSuggestion(option, itemIndex)
                              }
                            >
                              {option.label}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        {options.length > value.length && (
          <button
            type="button"
            className="flex items-center gap-1 rounded-md border border-actions-link bg-blue-50 px-3 py-1"
            onClick={() => {
              const updatedTerms = [...(value || [])];
              updatedTerms.push({
                category: "",
                tags: [],
                tagLabels: {}, // Initialize empty tagLabels object
              });
              onChange(updatedTerms);

              // Add empty search term for the new term
              setSearchTerms([...searchTerms, ""]);
            }}
          >
            <span className="text-sm text-actions-link">افزودن شرط</span>
            <BluePlusIcon />
          </button>
        )}
      </div>
    </div>
  );
}
