import React from "react";
import GridIcon from "../Icons/GridIcon";
import MoreIcon from "../Icons/MoreIcon";

interface InfoCardProps {
  category: string;
  title: string;
  /** Kept for API compatibility; view count is intentionally not displayed to customers. */
  likedCount?: number;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
  handleMenuToggle: (e: React.MouseEvent) => void;
  isMenuOpen: boolean;
}

export function InfoCard({
  category,
  title,
  menuButtonRef,
  handleMenuToggle,
  isMenuOpen,
  children,
}: InfoCardProps & { children?: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
      <div className="flex items-center justify-between gap-1">
        <div className="flex min-w-0 items-center gap-1">
          <GridIcon className="h-4 w-4 shrink-0 text-neutral-400" />
          <span className="truncate text-xs text-neutral-400">{category}</span>
        </div>
        <div className="flex shrink-0 items-center justify-between">
          <button
            ref={menuButtonRef}
            onClick={handleMenuToggle}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            aria-label="منوی عملیات"
            aria-expanded={isMenuOpen}
            type="button"
          >
            <MoreIcon className="h-6 w-6 text-neutral-400" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <h3 className="line-clamp-1 text-base text-neutral-800">{title}</h3>
      </div>

      {children}
    </div>
  );
}
