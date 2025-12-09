import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "w-full rounded-lg border px-3 py-3 text-sm text-right transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-75",
  {
    variants: {
      variant: {
        default: "border-slate-100 focus:border-actions-primary focus:ring-actions-primary/20",
        error: "border-red-500 focus:border-red-500 focus:ring-red-500/20",
      },
      size: {
        sm: "min-h-[80px] py-2 text-xs",
        default: "min-h-[96px]",
        lg: "min-h-[128px] py-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, size, label, error, disabled, wrapperClassName, ...props }, ref) => {
    return (
      <div className={cn("flex flex-col gap-1", wrapperClassName)}>
        {label && <label className="text-base text-foreground-primary lg:text-lg">{label}</label>}
        <textarea
          ref={ref}
          disabled={disabled}
          className={cn(
            textareaVariants({
              variant: error ? "error" : variant,
              size,
            }),
            className,
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
