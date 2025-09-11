"use client";

import { useState } from "react";

interface AvailabilityFilterProps {
  onChange: (checked: boolean) => void;
  defaultChecked?: boolean;
}

export default function AvailabilityFilter({
  onChange,
  defaultChecked = false,
}: AvailabilityFilterProps) {
  const [checked, setChecked] = useState(defaultChecked);

  const handleChange = () => {
    const newValue = !checked;
    setChecked(newValue);
    onChange(newValue);
  };

  return (
    <div className="rounded-2xl bg-stone-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-neutral-800">نمایش محصولات موجود</span>

        <div
          className={`relative flex h-4 w-7 items-center ${
            checked ? "bg-green-500" : "bg-gray-200"
          } cursor-pointer rounded-full p-1 transition-colors`}
          onClick={handleChange}
        >
          <div
            className={`h-3 w-3 transform rounded-full bg-white shadow-md transition-transform ${
              checked ? "-translate-x-2.5" : "translate-x-0"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
