import type { ButtonHTMLAttributes } from "react";
import { Search } from "lucide-react";

function cx(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(" ");
}

export type SearchBarProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  /** Placeholder / label text (Persian UI). */
  placeholder?: string;
};

/**
 * Header search control — Figma `Frame 92960` / inner `92959` (white pill, 268×44, 24px search glyph).
 * No horizontal auto-margin so it can sit flush start in the header; pass `className="mx-auto"` if you need it centered.
 */
export function SearchBar({
  placeholder = "دنبال چی میگردی؟",
  className,
  type = "button",
  dir = "rtl",
  ...props
}: SearchBarProps) {
  return (
    <button
      type={type}
      dir={dir}
      className={cx(
        "box-border flex h-[44px] w-[268px] flex-col items-end justify-center gap-[10px] rounded-[40px] bg-white p-[10px]",
        "text-right transition-opacity hover:opacity-90",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
        className,
      )}
      {...props}
    >
      <span className="flex h-6 w-full flex-row items-center justify-end gap-1">
        <Search
          className="shrink-0 text-[#94A3B8]"
          size={24}
          strokeWidth={1.2}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-right text-xs font-normal leading-[21px] text-[#A3A3A3]">
          {placeholder}
        </span>
      </span>
    </button>
  );
}
