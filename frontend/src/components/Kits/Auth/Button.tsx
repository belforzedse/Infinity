import { ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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
    <Button
      variant="primary"
      className={cn("text-xl h-[54px]", fullWidth && "w-full", className)}
      {...props}
    >
      {icon ? content : children}
    </Button>
  );
}
