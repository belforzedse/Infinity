import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

export default function AuthButton({
  children,
  className,
  fullWidth = true,
  icon,
  iconPosition = "right",
  ...props
}: AuthButtonProps) {
  const content = (
    <div className="flex items-center justify-center gap-[4.5px]">
      {iconPosition === "left" && icon}
      {typeof children === "string" ? <span>{children}</span> : children}
      {iconPosition === "right" && icon}
    </div>
  );

  return (
    <button
      className={clsx(
        "h-[54px] bg-pink-500/90 hover:bg-pink-500 disabled:bg-pink-300 disabled:cursor-not-allowed",
        "text-white rounded-lg text-xl transition-colors",
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {icon ? content : children}
    </button>
  );
}
