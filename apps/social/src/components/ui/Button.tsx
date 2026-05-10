import type { ButtonHTMLAttributes, ReactNode } from "react";

function cx(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(" ");
}

const variantClasses: Record<"default", string> = {
  default: cx(
    "inline-flex h-[37px] w-[107px] flex-row items-center justify-end gap-1 rounded-[19px] border-0 box-border",
    "bg-[linear-gradient(179.66deg,rgba(255,255,255,0.54)_26.71%,rgba(217,226,255,0.54)_105.94%)]",
    "py-2 pr-3 pl-[18px] font-medium text-xs leading-[21px] text-[#A49BA0]",
    "shadow-none transition-opacity hover:opacity-90",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
    "disabled:pointer-events-none disabled:opacity-50",
  ),
};

export type ButtonVariant = keyof typeof variantClasses;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** Optional trailing slot (e.g. 20×20 glyph). Not part of the button’s built-in styles beyond layout gap. */
  icon?: ReactNode;
  children?: ReactNode;
};

/**
 * Social app button. **Default** variant matches Figma frame (glass gradient pill, Peyda 12/500, `#A49BA0`).
 */
export function Button({
  variant = "default",
  className,
  children,
  icon,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(variantClasses[variant], className)}
      {...props}
    >
      {children}
      {icon != null ? (
        <span className="inline-flex shrink-0 items-center justify-center [&>svg]:block">
          {icon}
        </span>
      ) : null}
    </button>
  );
}
