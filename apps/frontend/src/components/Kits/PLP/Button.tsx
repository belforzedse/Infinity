import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function PLPButton({
  text,
  className,
  rightIcon,
  leftIcon,
  onClick,
  disabled = false,
  variant = "outline",
  fullWidth = true,
}: {
  text: string;
  className?: string;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "outline";
  fullWidth?: boolean;
}) {
  return (
    <Button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      variant={variant}
      className={cn(
        "text-xs gap-1 rounded-lg bg-background-secondary px-3 py-1 !leading-[32px]",
        "flex items-center justify-center",
        fullWidth ? "w-full" : "inline-flex",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span className="pointer-events-none flex items-center justify-center gap-1">
        {leftIcon && <span className="pointer-events-none">{leftIcon}</span>}
        <span className="pointer-events-none">{text}</span>
        {rightIcon && <span className="pointer-events-none">{rightIcon}</span>}
      </span>
    </Button>
  );
}
