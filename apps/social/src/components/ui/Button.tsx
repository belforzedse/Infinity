import type { ButtonHTMLAttributes, ReactNode } from "react";

function cx(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Shared shell — **identical for every variant**. Variants only change colors
 * (gradients + text + shadow). Size, radius, padding, type size, alignment,
 * icon spacing, focus ring, disabled treatment are all defined here so the
 * `variant` prop never affects geometry.
 *
 * - Height: **`h-11`** (44px) with `min-h-11` to survive flex shrinking.
 * - Width: intrinsic to content (no `w-*` set) — `block` overrides to `w-full`.
 * - Shape: **`rounded-full`** capsule.
 * - Typography: **`text-sm`** (14px) / `leading-[21px]` / `font-medium`.
 * - Padding: **`px-5`**.
 * - Inner row: **`justify-center gap-1.5`** (label + optional trailing icon).
 */
const shellLayout = cx(
  "pressable relative isolate inline-flex h-11 min-h-11 max-w-full min-w-0",
  "cursor-pointer flex-row items-center justify-center overflow-hidden",
  "rounded-full border-0 box-border",
  "px-5 font-medium text-sm leading-[21px]",
  "transition-colors",
  "disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50",
  "disabled:hover:before:opacity-100 disabled:hover:after:opacity-0",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
);

/** Shared pseudo-element scaffold so every variant has the same crossfade ceremony — only the gradient values change. */
const surfacePseudoBase = cx(
  "bg-transparent",
  "before:pointer-events-none before:absolute before:inset-0 before:z-0 before:rounded-full before:content-['']",
  "before:opacity-100 before:transition-opacity before:duration-300 before:ease-out",
  "after:pointer-events-none after:absolute after:inset-0 after:z-0 after:rounded-full after:content-['']",
  "after:opacity-0 after:transition-opacity after:duration-300 after:ease-out",
  "hover:before:opacity-0 hover:after:opacity-100 motion-reduce:hover:before:opacity-100 motion-reduce:hover:after:opacity-0",
);

const variantClasses = {
  default: cx(
    shellLayout,
    surfacePseudoBase,
    "text-[#A49BA0] shadow-none",
    "before:bg-[linear-gradient(179.66deg,rgba(255,255,255,0.54)_26.71%,rgba(217,226,255,0.54)_105.94%)]",
    "after:bg-[linear-gradient(22.48deg,rgba(255,255,255,0.54)_-104.7%,rgba(217,226,255,0.54)_88.1%)]",
  ),
  gray: cx(
    shellLayout,
    surfacePseudoBase,
    "text-white shadow-none",
    "before:bg-[linear-gradient(180deg,rgba(7,33,87,0.41)_0%,rgba(118,148,212,0.39)_100%)]",
    "after:bg-[linear-gradient(55.5deg,rgba(25,39,67,0.56)_-6.01%,rgba(180,205,255,0.57)_69.28%)]",
  ),
  blue: cx(
    shellLayout,
    surfacePseudoBase,
    "text-white shadow-[0_4px_14px_rgba(57,76,110,0.22)]",
    "before:bg-[linear-gradient(180deg,#566D97_0%,#98BDFF_100%)]",
    "after:bg-[linear-gradient(70.36deg,#3E5070_10.29%,#A0C2FF_74.27%)]",
  ),
} as const;

export type ButtonVariant = keyof typeof variantClasses;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** Optional trailing slot (e.g. ~20×20 glyph). Laid out on the physical right: inner row is `dir="ltr"` so the icon follows the label in RTL pages. */
  icon?: ReactNode;
  /** Stretch the button to fill its parent's width. Useful for laying equal-width buttons in a grid / row. Pair with a sized parent (e.g. `grid grid-cols-2`). */
  block?: boolean;
  children?: ReactNode;
};

/**
 * Social app button.
 * - **Size / shape / padding / type are identical across all variants.** The `variant`
 *   prop **only** swaps colors (gradients + text + drop shadow). To resize the button
 *   externally, pass `className` with size utilities (Tailwind class precedence applies).
 * - **default** — glass white→light-blue crossfade, `#A49BA0` text. No shadow.
 * - **gray** — navy / blue glass crossfade, white text. No shadow.
 * - **blue** — `#566D97 → #98BDFF` gradient (hover crossfades to `#3E5070 → #A0C2FF`), white text, soft navy drop shadow.
 *
 * Pass `block` to stretch to the parent's width with the label re-centered.
 */
export function Button({
  variant = "default",
  className,
  children,
  icon,
  block = false,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(variantClasses[variant], block && "w-full", className)}
      {...props}
    >
      <span
        dir="ltr"
        className={cx(
          "relative z-10 inline-flex min-w-0 flex-row items-center justify-center gap-1.5",
          block && "w-full",
        )}
      >
        <span dir="rtl" className="min-w-0">
          {children}
        </span>
        {icon != null ? (
          <span className="inline-flex shrink-0 items-center justify-center [&>svg]:block [&>svg]:stroke-[1.5]">
            {icon}
          </span>
        ) : null}
      </span>
    </button>
  );
}
