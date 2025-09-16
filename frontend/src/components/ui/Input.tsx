import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva("input w-full", {
  variants: {
    size: {
      default: "h-10 px-3 py-2",
      sm: "h-8 px-2",
      lg: "h-12 px-4",
    },
    variant: {
      default: "",
      auth: "text-base text-foreground-primary rounded-xl border border-slate-200 bg-background-form placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-pink-400",
    },
  },
  defaultVariants: {
    size: "default",
    variant: "default",
  },
});

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  error?: string | null;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  parentClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size,
      variant,
      type = "text",
      error,
      rightElement,
      leftElement,
      parentClassName,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={parentClassName}>
        <div className="relative">
          <input
            type={type}
            className={cn(
              inputVariants({ size, variant }),
              rightElement && "pr-[6rem] md:pr-[5rem]",
              leftElement && "pl-12",
              error && "border-red-500",
              className,
            )}
            ref={ref}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
          {leftElement && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              {leftElement}
            </div>
          )}
        </div>
        {error && <span className="mt-1 block text-red-500">{error}</span>}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
