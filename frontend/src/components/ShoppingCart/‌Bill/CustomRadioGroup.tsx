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
    <div className="flex flex-col gap-3 w-full">
      {options.map((option) => (
        <label
          key={option.id}
          className={`flex items-center w-full rounded-lg cursor-pointer transition-all duration-200 bg-white py-3 px-4 gap-1 ${
            value === option.value ? "ring-1 ring-pink-500" : ""
          }`}
        >
          <div className="relative flex items-center justify-center w-5 h-5">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => {
                onChange(option.value);
              }}
              className="peer appearance-none w-5 h-5 rounded-full border-2 border-gray-300 
                     checked:border-[#DB2777] transition-colors duration-200 
                     cursor-pointer"
            />
            <div className="absolute w-3 h-3 rounded-full bg-[#DB2777] scale-0 peer-checked:scale-100 transition-transform duration-200" />
          </div>

          <div className="flex-1 text-neutral-800">{option.content}</div>
        </label>
      ))}
    </div>
  );
};

export default CustomRadioGroup;
