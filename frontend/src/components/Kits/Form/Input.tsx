import React, { InputHTMLAttributes, ChangeEvent } from "react";

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
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
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={name}
            className="block text-right text-foreground-primary lg:mb-2 mb-1 lg:text-lg text-base"
          >
            {label}
            {required && <span className="text-red-500 mr-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
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
            className={`
              w-full
              lg:p-3 p-2
              text-right
              border
              border-slate-200
              rounded-lg
              focus:outline-none
              text-foreground-primary
              placeholder:text-foreground-muted
              placeholder:text-sm
              disabled:bg-gray-100
              disabled:cursor-not-allowed
              lg:text-lg text-sm
              max-h-[50px]
              ${icon ? "pl-10" : ""}
              ${error ? "border-red-500" : ""}
              ${className || ""}
            `}
            {...props}
          />
          {icon && (
            <button
              type="button"
              onClick={onIconClick}
              className={`absolute left-3 top-1/2 -translate-y-1/2 p-1 
                        ${
                          onIconClick
                            ? "cursor-pointer hover:opacity-80"
                            : "cursor-default"
                        }
                        ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={disabled}
            >
              {icon}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1 text-right text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
