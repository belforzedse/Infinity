import React from "react";
import { ShippingMethod } from "@/services/shipping";

interface CustomRadioGroupProps {
  options: {
    id: string;
    content: React.ReactNode;
    value: string;
    method?: ShippingMethod;
  }[];
  value: string;
  onChange: (value: string) => void;
  name: string;
}

const CustomRadioGroup: React.FC<CustomRadioGroupProps> = ({
  options,
  value,
  name,
  onChange,
}) => {
  return (
    <div className="flex w-full flex-col gap-3">
      {options.map((option) => (
        <label
          key={option.id}
          className={`flex w-full cursor-pointer items-center gap-1 rounded-lg bg-white px-4 py-3 transition-all duration-200 ${
            value === option.value ? "ring-1 ring-pink-500" : ""
          }`}
        >
          <div className="relative flex h-5 w-5 items-center justify-center">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => {
                onChange(option.value);
              }}
              className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border-2 border-gray-300 transition-colors duration-200 checked:border-[#DB2777]"
            />
            <div className="absolute h-3 w-3 scale-0 rounded-full bg-[#DB2777] transition-transform duration-200 peer-checked:scale-100" />
          </div>

          <div className="flex-1 text-neutral-800">{option.content}</div>
        </label>
      ))}
    </div>
  );
};

export default CustomRadioGroup;
