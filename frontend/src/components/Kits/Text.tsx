import clsx from "clsx";

interface TextProps {
  children: React.ReactNode;
  variant?: "label" | "helper" | "link";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export default function Text({
  children,
  variant = "helper",
  className,
  onClick,
  disabled = false,
}: TextProps) {
  const baseStyles = {
    label: "text-lg text-foreground-primary/80 text-right",
    helper: "text-sm text-foreground-muted/80",
    link: clsx(
      "text-sm transition-colors",
      disabled ? "text-foreground-muted" : "text-pink-500 hover:text-pink-600",
      "cursor-pointer"
    ),
  };

  return (
    <span
      className={clsx(baseStyles[variant], className)}
      onClick={!disabled ? onClick : undefined}
    >
      {children}
    </span>
  );
}
