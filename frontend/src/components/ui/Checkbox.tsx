"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const checkboxVariants = cva(
  "peer grid shrink-0 place-items-center rounded-md border bg-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-actions-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-75",
  {
    variants: {
      variant: {
        default:
          "border-slate-200 text-foreground-primary data-[state=checked]:border-actions-primary data-[state=checked]:bg-actions-primary data-[state=checked]:text-white",
        sky: "border-slate-200 text-foreground-primary data-[state=checked]:border-sky-600 data-[state=checked]:bg-sky-600 data-[state=checked]:text-white",
      },
      size: {
        default: "h-5 w-5",
        sm: "h-4 w-4",
        lg: "h-6 w-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const checkboxLabelVariants = cva("flex items-center gap-2.5 cursor-pointer text-base text-foreground-primary", {
  variants: {
    disabled: {
      true: "cursor-not-allowed opacity-50",
      false: "",
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

export interface CheckboxProps
  extends Omit<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, "onChange">,
    VariantProps<typeof checkboxVariants> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  wrapperClassName?: string;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(
  (
    {
      checked = false,
      onChange,
      label,
      className,
      variant,
      size,
      disabled = false,
      labelClassName,
      wrapperClassName,
      ...props
    },
    ref
  ) => {
    const handleCheckedChange = (newChecked: boolean) => {
      onChange?.(newChecked);
    };

    const CheckboxElement = (
      <CheckboxPrimitive.Root
        ref={ref}
        checked={checked}
        onCheckedChange={handleCheckedChange}
        disabled={disabled}
        className={cn(checkboxVariants({ variant, size }), className)}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          <Check className={cn("h-3.5 w-3.5", size === "sm" && "h-3 w-3", size === "lg" && "h-4 w-4")} strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );

    if (label) {
      return (
        <label
          className={cn(
            checkboxLabelVariants({ disabled }),
            wrapperClassName
          )}
        >
          {CheckboxElement}
          <span className={cn("text-sm text-foreground-primary lg:text-base", labelClassName)}>
            {label}
          </span>
        </label>
      );
    }

    return CheckboxElement;
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox, checkboxVariants };
