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

  const handleChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const newValue = !checked;
    setChecked(newValue);
    onChange(newValue);
  };

  return (
    <div className="bg-stone-50 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-neutral-800">نمایش محصولات موجود</span>

        <div
          className={`relative w-7 h-4 flex items-center ${
            checked ? "bg-green-500" : "bg-gray-200"
          } rounded-full p-1 cursor-pointer transition-colors`}
          onClick={handleChange}
        >
          <div
            className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
              checked ? "-translate-x-2.5" : "translate-x-0"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
