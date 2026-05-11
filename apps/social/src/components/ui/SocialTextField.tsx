"use client";

import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const fontFeatureStyle = { fontFeatureSettings: '"ss01" 1, "calt" 0, "kern" 0' } as const;

export type SocialTextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  /** Width / max-width utilities (e.g. `w-full`, `max-w-md`). */
  className?: string;
  /** Same pattern as auth inputs: controlled updates without wiring `onChange`. */
  onEdit?: (value: string) => void;
  error?: string | null;
  /** Optional description id for `aria-describedby` when `error` is set. */
  errorId?: string;
};

/**
 * Profile / social shell text field: 48px tall, 24px radius, Peyda 14/24, placeholder `#A3A3A3`.
 * Rest: white + soft shadow; hover/focus: `1px` `#94A3B8` border, shadow off.
 */
export const SocialTextField = forwardRef<HTMLInputElement, SocialTextFieldProps>(
  function SocialTextField(
    {
      className,
      onEdit,
      onChange,
      error,
      errorId: errorIdProp,
      id,
      readOnly,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) {
    const genId = useId();
    const errorId = errorIdProp ?? (error ? `${genId}-error` : undefined);
    const describedBy = cx(ariaDescribedBy ?? false, error ? errorId : false);

    return (
      <div className="w-full min-w-0">
        <input
          ref={ref}
          id={id}
          readOnly={readOnly}
          aria-describedby={describedBy || undefined}
          style={fontFeatureStyle}
          className={cx(
            "box-border h-12 max-h-12 min-h-12 w-full min-w-0 rounded-[24px] bg-white px-4 py-2",
            "text-right text-sm font-normal leading-6 text-zinc-800",
            "placeholder:text-[#A3A3A3]",
            "border border-transparent shadow-[0_0_14.7px_rgba(0,0,0,0.04)]",
            "transition-[border-color,box-shadow,opacity]",
            !readOnly && "hover:border-[#94A3B8] hover:shadow-none",
            !readOnly && "focus:border-[#94A3B8] focus:shadow-none focus:outline-none",
            readOnly &&
              "cursor-default bg-zinc-50 text-zinc-600 hover:border-transparent hover:shadow-[0_0_14.7px_rgba(0,0,0,0.04)] focus:border-transparent focus:shadow-[0_0_14.7px_rgba(0,0,0,0.04)] focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-60",
            error
              ? "border-red-500 shadow-none hover:border-red-500 focus:border-red-500"
              : false,
            className,
          )}
          onChange={(e) => {
            if (readOnly) return;
            onEdit?.(e.target.value);
            onChange?.(e);
          }}
          {...props}
        />
        {error ? (
          <p id={errorId} className="mt-1 text-right text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
