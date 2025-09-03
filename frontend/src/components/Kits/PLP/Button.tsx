import { twMerge } from "tailwind-merge";

export default function PLPButton({
  text,
  className,
  rightIcon,
  leftIcon,
  onClick,
  disabled = false,
}: {
  text: string;
  className?: string;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={twMerge(
        "text-xs flex w-full items-center justify-center gap-1 rounded-lg bg-background-secondary px-3 py-1 !leading-[32px] text-[#333]",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span className="pointer-events-none flex items-center justify-center gap-1">
        {rightIcon && <span className="pointer-events-none">{rightIcon}</span>}
        <span className="pointer-events-none">{text}</span>
        {leftIcon && <span className="pointer-events-none">{leftIcon}</span>}
      </span>
    </button>
  );
}
