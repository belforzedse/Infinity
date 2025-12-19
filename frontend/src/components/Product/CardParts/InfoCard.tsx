import React from "react";
import GridIcon from "../Icons/GridIcon";
import MoreIcon from "../Icons/MoreIcon";
import HeartIcon from "../Icons/HeartIcon";
import { faNum } from "@/utils/faNum";

interface InfoCardProps {
  category: string;
  title: string;
  likedCount: number;
interface InfoCardProps {
  category: string;
  title: string;
  likedCount: number;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
  handleMenuToggle: (e: React.MouseEvent) => void;
  isMenuOpen: boolean;
}
  handleMenuToggle: (e: React.MouseEvent) => void;
  isMenuOpen: boolean;
}

export function InfoCard({
  category,
  title,
  likedCount,
  menuButtonRef,
  handleMenuToggle,
  isMenuOpen,
  children,
}: InfoCardProps & { children?: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex flex-1 flex-col justify-between py-0.5">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <GridIcon className="h-4 w-4 text-neutral-400" />
          <span className="text-xs text-neutral-400">{category}</span>
        </div>
        <div className="flex items-center justify-between">
          <button
            ref={menuButtonRef}
            onClick={handleMenuToggle}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            aria-label="منوی عملیات"
            aria-expanded={isMenuOpen}
            type="button"
          >
            <MoreIcon className="h-6 w-6 text-pink-500" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <h3 className="text-xs line-clamp-1 text-neutral-800">{title}</h3>
        {likedCount > 100 && (
          <div className="flex items-center gap-0.5">
            <HeartIcon className="h-2 w-2 text-pink-600" />
            <span className="text-[10px] text-pink-600">
              {faNum(likedCount)} نفر این محصول را پسندیدند!
            </span>
          </div>
        )}
      </div>

      {children}
    </div>
  );
}

