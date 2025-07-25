import React, { InputHTMLAttributes } from "react";

interface Option {
  label: string;
  value: string;
}

interface RadioButtonProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
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
  (
    { label, name, value, checked, onChange, className = "", ...props },
    ref
  ) => {
    return (
      <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
        <div className="relative flex items-center justify-center w-5 h-5">
          <input
            type="radio"
            ref={ref}
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
            className="peer appearance-none w-5 h-5 rounded-full border-2 border-gray-300 
                     checked:border-[#DB2777] transition-colors duration-200 
                     cursor-pointer"
            {...props}
          />
          <div className="absolute w-3 h-3 rounded-full bg-[#DB2777] scale-0 peer-checked:scale-100 transition-transform duration-200" />
        </div>
        <span className="text-sm text-gray-800">{label}</span>
      </label>
    );
  }
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
      {label && (
        <label className="text-foreground-primary mb-3 text-lg">{label}</label>
      )}
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
