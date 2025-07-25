import { InputHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import Text from "../../Text";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string | null;
  rightElement?: ReactNode;
  leftElement?: ReactNode;
  onEdit?: (value: string) => void;
  value?: string;
  parentClassNames?: string;
}

export default function AuthInput({
  error,
  className,
  rightElement,
  leftElement,
  onEdit,
  value,
  parentClassNames,
  ...props
}: AuthInputProps) {
  return (
    <div className={parentClassNames}>
      <div className="relative">
        <input
          className={clsx(
            "w-full h-12 bg-background-form border border-slate-200 rounded-lg",
            "text-base text-foreground-muted",
            rightElement ? "pr-[4.5rem]" : "pr-4",
            leftElement ? "pl-12" : "pl-4",
            "focus:outline-none focus:ring-2 focus:ring-pink-400",
            error && "border-red-500",
            className
          )}
          onChange={(e) => onEdit?.(e.target.value)}
          value={value}
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
      {error && <Text className="text-red-500 mt-1">{error}</Text>}
    </div>
  );
}
