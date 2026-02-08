import React, { useState, useEffect, memo, useRef } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvince, setSelectedProvince] = useAtom(selectedProvinceAtom);
  const hasFetchedRef = useRef(false);

  // Update localOptions when options prop changes (for static options)
  useEffect(() => {
    if (options.length > 0 && !fetchOptions) {
      setLocalOptions(options);
    }
  }, [options, fetchOptions]);

  // Fetch options when fetchOptions is available
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("DropdownField useEffect:", {
        hasFetchOptions: !!fetchOptions,
        optionsLength: options.length,
        hasFetched: hasFetchedRef.current,
        isLoading,
        localOptionsLength: localOptions.length,
      });
    }

    // Only fetch if we have fetchOptions, no static options, and not currently loading
    if (!fetchOptions || options.length > 0 || isLoading) {
      return;
    }

    // If we've already fetched once successfully, avoid refetch loops.
    if (hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    setIsLoading(true);
    let isMounted = true;

    if (process.env.NODE_ENV === "development") {
      console.log("DropdownField: Starting fetch");
    }

    fetchOptions("", formData)
      .then((fetchedOptions) => {
        if (!isMounted) return;
        if (process.env.NODE_ENV === "development") {
          console.log("DropdownField: Fetched options:", fetchedOptions);
          console.log("DropdownField: Is array?", Array.isArray(fetchedOptions));
          if (Array.isArray(fetchedOptions)) {
            console.log("DropdownField: Options length:", fetchedOptions.length);
            console.log("DropdownField: First 3 options:", fetchedOptions.slice(0, 3));
          }
        }
        if (Array.isArray(fetchedOptions)) {
          setLocalOptions(fetchedOptions);
          if (process.env.NODE_ENV === "development") {
            console.log("DropdownField: Set localOptions to", fetchedOptions.length, "options");
          }
          if (fetchedOptions.length === 0) {
            console.warn("DropdownField: Fetched options array is empty");
          }
        } else {
          console.warn("DropdownField: Fetched options is not an array:", fetchedOptions);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error("Failed to fetch dropdown options:", error);
        setIsLoading(false);
        hasFetchedRef.current = true; // Prevent infinite retry loop on persistent errors
      });

    return () => {
      isMounted = false;
    };
  }, [fetchOptions, options.length, formData, isLoading]);

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

  // Debug: log current state
  if (process.env.NODE_ENV === "development") {
    console.log("DropdownField render:", {
      localOptionsLength: localOptions.length,
      localOptions,
      isLoading,
      hasFetchOptions: !!fetchOptions,
      value,
    });
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-neutral-200">
      <div className="relative">
        <select
          className={`text-sm w-full border-l-[20px] border-transparent px-5 py-3 ${
            readOnly ? "bg-slate-100 text-slate-500" : ""
          } ${isLoading ? "opacity-50" : ""}`}
          disabled={readOnly || isLoading}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
        >
          <option value="">{isLoading ? "در حال بارگیری..." : placeholder}</option>
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
