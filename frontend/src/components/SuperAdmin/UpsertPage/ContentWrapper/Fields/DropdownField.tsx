import React, { useState, useEffect, memo, useCallback } from "react";
import { useAtom } from "jotai";
import { selectedProvinceAtom } from "@/atoms/provinceAtom";

type Option = {
  label: string;
  value: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  readOnly?: boolean;
  fetchOptions?: (searchTerm: string, formData?: any) => Promise<Option[]>;
  placeholder?: string;
  formData?: any;
  name?: string;
};

function DropdownField({
  value,
  onChange,
  options,
  readOnly,
  fetchOptions,
  placeholder = "انتخاب کنید",
  formData,
  name,
}: Props) {
  const [localOptions, setLocalOptions] = useState<Option[]>(options);
  const [selectedProvince, setSelectedProvince] = useAtom(selectedProvinceAtom);

  // Memoize the fetch options function
  const fetchOptionsCallback = useCallback(async () => {
    if (fetchOptions && localOptions.length === 0) {
      const fetchedOptions = await fetchOptions("", formData);
      setLocalOptions(fetchedOptions);
    }
  }, [fetchOptions, formData, localOptions.length]);

  // Initial load of options only once
  useEffect(() => {
    fetchOptionsCallback();
  }, [fetchOptionsCallback]);

  // Handle province selection
  const handleChange = (newValue: string) => {
    onChange(newValue);

    // If this is the province dropdown, update the atom
    if (name === "province") {
      setSelectedProvince(newValue);
    }
  };

  // Reload city options only when province changes and it's a city dropdown
  useEffect(() => {
    if (name === "city" && fetchOptions && selectedProvince) {
      const updatedFormData = {
        ...formData,
        province: selectedProvince,
      };

      fetchOptions("", updatedFormData).then((fetchedOptions) => {
        setLocalOptions(fetchedOptions);
      });
    }
  }, [selectedProvince, name, fetchOptions, formData]);

  return (
    <div className="w-full border border-neutral-200 rounded-lg overflow-hidden">
      <div className="relative">
        <select
          className={`w-full py-3 px-5 text-sm border-l-[20px] border-transparent ${
            readOnly ? "bg-slate-100 text-slate-500" : ""
          }`}
          disabled={readOnly}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {localOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default memo(DropdownField);
