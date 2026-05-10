import type { ButtonHTMLAttributes, ReactNode } from "react";
import { glassDefaultCrossfadeSurface } from "@/components/ui/glass-default-crossfade";

function cx(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(" ");
}

const glassDefaultRounded20 = glassDefaultCrossfadeSurface(
  "before:rounded-[20px]",
  "after:rounded-[20px]",
);

/**
 * All variants: fixed `40px` height, content-driven width (`w-auto`), unified `20px` corner radius.
 */
const shellLayout =
  "relative isolate inline-flex h-[40px] w-auto min-w-0 cursor-pointer flex-row items-center overflow-hidden rounded-[20px] border-0 box-border disabled:cursor-not-allowed";

const variantClasses = {
  default: cx(
    shellLayout,
    "justify-end gap-1",
    "pr-3 pl-[18px] font-medium text-xs leading-[21px] text-[#A49BA0]",
    glassDefaultRounded20,
    "disabled:pointer-events-none disabled:opacity-50 disabled:hover:before:opacity-100 disabled:hover:after:opacity-0",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
  ),
  gray: cx(
    shellLayout,
    "justify-center",
    "bg-transparent px-[18px] font-medium text-sm leading-[21px] text-white",
    "shadow-none",
    "before:pointer-events-none before:absolute before:inset-0 before:z-0 before:rounded-[20px] before:content-['']",
    "before:bg-[linear-gradient(180deg,rgba(7,33,87,0.41)_0%,rgba(118,148,212,0.39)_100%)]",
    "before:opacity-100 before:transition-opacity before:duration-300 before:ease-out",
    "after:pointer-events-none after:absolute after:inset-0 after:z-0 after:rounded-[20px] after:content-['']",
    "after:bg-[linear-gradient(55.5deg,rgba(25,39,67,0.56)_-6.01%,rgba(180,205,255,0.57)_69.28%)]",
    "after:opacity-0 after:transition-opacity after:duration-300 after:ease-out",
    "hover:before:opacity-0 hover:after:opacity-100 motion-reduce:hover:before:opacity-100 motion-reduce:hover:after:opacity-0",
    "disabled:pointer-events-none disabled:opacity-50 disabled:hover:before:opacity-100 disabled:hover:after:opacity-0",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
  ),
  blue: cx(
    "relative isolate inline-flex h-11 min-h-11 w-max max-w-full min-w-0 cursor-pointer flex-row items-center justify-center overflow-hidden rounded-full border-0 box-border disabled:cursor-not-allowed",
    "shadow-[0_4px_14px_rgba(57,76,110,0.22)]",
    "gap-1.5",
    "bg-transparent px-5 font-medium text-sm leading-[21px] text-white",
    "before:pointer-events-none before:absolute before:inset-0 before:z-0 before:rounded-full before:content-['']",
    "before:bg-[linear-gradient(180deg,#566D97_0%,#98BDFF_100%)]",
    "before:opacity-100 before:transition-opacity before:duration-300 before:ease-out",
    "after:pointer-events-none after:absolute after:inset-0 after:z-0 after:rounded-full after:content-['']",
    "after:bg-[linear-gradient(70.36deg,#3E5070_10.29%,#A0C2FF_74.27%)]",
    "after:opacity-0 after:transition-opacity after:duration-300 after:ease-out",
    "hover:before:opacity-0 hover:after:opacity-100 motion-reduce:hover:before:opacity-100 motion-reduce:hover:after:opacity-0",
    "disabled:pointer-events-none disabled:opacity-50 disabled:hover:before:opacity-100 disabled:hover:after:opacity-0",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
  ),
} as const;

export type ButtonVariant = keyof typeof variantClasses;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** Optional trailing slot (e.g. 20×20 glyph). Laid out on the physical right: inner row is `dir="ltr"` so the icon follows the label in RTL pages. */
  icon?: ReactNode;
  children?: ReactNode;
};

/**
 * Social app button.
 * - **default** — glass pill (12px/500, `#A49BA0`); hover crossfades to lighter glass gradient.
 * - **gray** — Figma link-style pill (14px/500, white): `180deg` navy/blue glass default, `55.5deg` hover gradient; same 300ms crossfade.
 * - **blue** — capsule CTA (14px/500, white): full pill `rounded-full`, `44px` tall, soft drop shadow; `180deg` `#566D97→#98BDFF`; hover `70.36deg` `#3E5070→#A0C2FF`. Optional icon: `[&>svg]:stroke-[1.5]` (icon on the visual right in RTL with label).
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
      <span
        dir="ltr"
        className={cx(
          "relative z-10 inline-flex min-w-0 flex-row items-center",
          variant === "gray" ? "justify-center gap-[10px]" : variant === "blue" ? "justify-center gap-1.5" : "justify-end gap-1",
        )}
      >
        <span dir="rtl" className="min-w-0">
          {children}
        </span>
        {icon != null ? (
          <span
            className={cx(
              "inline-flex shrink-0 items-center justify-center [&>svg]:block",
              variant === "blue" && "[&>svg]:stroke-[1.5]",
            )}
          >
            {icon}
          </span>
        ) : null}
      </span>
    </button>
  );
}
