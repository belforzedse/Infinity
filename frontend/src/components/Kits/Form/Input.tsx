import React, { InputHTMLAttributes, ChangeEvent } from "react";
import { Input as UITextInput } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "size"> {
  label?: string;
  error?: string;
  value?: string;
  name: string;
  placeholder?: string;
  type?: "text" | "password" | "email" | "number" | "tel";
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  autoComplete?: string;
  dir?: "rtl" | "ltr";
  icon?: React.ReactNode;
  onIconClick?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      className,
      value,
      name,
      placeholder,
      type = "text",
      onChange,
      required = false,
      disabled = false,
      maxLength,
      minLength,
      pattern,
      autoComplete,
      dir = "rtl",
      icon,
      onIconClick,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={name}
            className="text-base mb-1 block text-right text-foreground-primary lg:text-lg lg:mb-2"
          >
            {label}
            {required && <span className="mr-1 text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          <UITextInput
            ref={ref}
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            maxLength={maxLength}
            minLength={minLength}
            pattern={pattern}
            autoComplete={autoComplete}
            dir={dir}
            className={cn(
              "max-h-[50px] text-foreground-primary",
              icon && "pl-10",
              error && "border-red-500",
              className,
            )}
            {...props}
          />
          {icon && (
            <button
              type="button"
              onClick={onIconClick}
              className={`absolute left-3 top-1/2 -translate-y-1/2 p-1 ${
                onIconClick
                  ? "cursor-pointer hover:opacity-80"
                  : "cursor-default"
              } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
              disabled={disabled}
            >
              {icon}
            </button>
          )}
        </div>
        {error && (
          <p className="text-sm mt-1 text-right text-red-500">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
