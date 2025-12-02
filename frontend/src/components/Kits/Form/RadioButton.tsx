import type { InputHTMLAttributes } from "react";
import React from "react";

interface Option {
  label: string;
  value: string;
}

interface RadioButtonProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  name: string;
  value: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

interface RadioGroupProps {
  label?: string;
  name: string;
  options: Option[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const RadioButton = React.forwardRef<HTMLInputElement, RadioButtonProps>(
  ({ label, name, value, checked, onChange, className = "", ...props }, ref) => {
    return (
      <label className={`flex cursor-pointer items-center gap-2 ${className}`}>
        <div className="relative flex h-5 w-5 items-center justify-center">
          <input
            type="radio"
            ref={ref}
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
            className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border-2 border-gray-300 transition-colors duration-200 checked:border-[#DB2777]"
            {...props}
          />
          <div className="absolute h-3 w-3 scale-0 rounded-full bg-[#DB2777] transition-transform duration-200 peer-checked:scale-100" />
        </div>
        <span className="text-sm text-gray-800">{label}</span>
      </label>
    );
  },
);

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  className = "",
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-lg mb-3 text-foreground-primary">{label}</label>}
      <div className={`flex items-center gap-4 ${className}`}>
        {options.map((option) => (
          <RadioButton
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            checked={value === option.value}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
};

RadioButton.displayName = "RadioButton";

export default RadioButton;
