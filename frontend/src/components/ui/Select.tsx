"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2 } from "lucide-react";

export interface Option {
  id: number | string;
  name: string;
}

const selectTriggerVariants = cva(
  "relative flex w-full items-center justify-between rounded-lg border px-3 py-3 text-sm text-right transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-75",
  {
    variants: {
      variant: {
        default: "border-slate-100 focus:border-actions-primary focus:ring-actions-primary/20",
        error: "border-red-500 focus:border-red-500 focus:ring-red-500/20",
      },
      size: {
        default: "h-auto py-3",
        sm: "h-9 py-2 text-xs",
        lg: "h-12 py-3.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface SelectProps extends VariantProps<typeof selectTriggerVariants> {
  label?: string;
  value?: Option | null;
  onChange: (value: Option) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  selectButtonClassName?: string;
  isLoading?: boolean;
  error?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      value = null,
      onChange,
      options,
      placeholder = "انتخاب کنید",
      className = "",
      selectButtonClassName,
      isLoading = false,
      error,
      emptyMessage = "موردی یافت نشد",
      disabled = false,
      variant,
      size,
    },
    ref
  ) => {
    const selectedValue = value ? String(value.id) : undefined;

    const handleValueChange = (newValue: string) => {
      const selectedOption = options.find((opt) => String(opt.id) === newValue);
      if (selectedOption) {
        onChange(selectedOption);
      }
    };

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {label && (
          <label className="text-base text-foreground-primary lg:text-lg">{label}</label>
        )}

        <SelectPrimitive.Root
          value={selectedValue}
          onValueChange={handleValueChange}
          disabled={isLoading || disabled}
        >
          <SelectPrimitive.Trigger
            ref={ref}
            className={cn(
              selectTriggerVariants({
                variant: error ? "error" : variant,
                size,
              }),
              selectButtonClassName
            )}
          >
            <SelectPrimitive.Value asChild>
              <span className="block truncate text-neutral-600">
                {isLoading ? "در حال بارگیری..." : value?.name || placeholder}
              </span>
            </SelectPrimitive.Value>
            <SelectPrimitive.Icon asChild>
              <span className="flex items-center">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </span>
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              className="relative z-[60] max-h-60 overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
              position="popper"
              sideOffset={4}
            >
              <SelectPrimitive.Viewport className="py-1">
                {options.length === 0 ? (
                  <div className="relative cursor-default select-none px-4 py-2 text-sm text-gray-500">
                    {emptyMessage}
                  </div>
                ) : (
                  options.map((option) => (
                    <SelectPrimitive.Item
                      key={option.id}
                      value={String(option.id)}
                      className="relative cursor-pointer select-none px-4 py-2 text-right text-sm text-gray-900 outline-none transition-colors hover:bg-pink-50 focus:bg-pink-50 data-[state=checked]:font-medium"
                    >
                      <SelectPrimitive.ItemText>{option.name}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  ))
                )}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select, selectTriggerVariants };
