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
        "bg-background-secondary text-[#333] text-xs px-3 py-1 rounded-lg flex items-center justify-center gap-1 !leading-[32px] w-full",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span className="flex items-center justify-center gap-1 pointer-events-none">
        {rightIcon && <span className="pointer-events-none">{rightIcon}</span>}
        <span className="pointer-events-none">{text}</span>
        {leftIcon && <span className="pointer-events-none">{leftIcon}</span>}
      </span>
    </button>
  );
}
