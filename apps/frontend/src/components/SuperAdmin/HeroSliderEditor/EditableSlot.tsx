"use client";

import { type ReactElement, type ReactNode, useState } from "react";
import { Pencil } from "lucide-react";
import { slotLabelMap, type SlotKey } from "@/components/SuperAdmin/HeroSliderEditor/utils";

type EditableSlotProps = {
  slotKey: SlotKey;
  selected: boolean;
  onSelect: (anchorEl: HTMLElement) => void;
  className?: string;
  children: ReactNode;
};

export function EditableSlot({
  slotKey,
  selected,
  onSelect,
  className,
  children,
}: EditableSlotProps): ReactElement {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const label = slotLabelMap[slotKey] || slotKey;
  const showOverlay = (isHovered || isFocused) && !selected;

  return (
    <div
      role="group"
      aria-label={label}
      tabIndex={0}
      className={`group relative overflow-visible outline-none ${className || ""}`}
      data-slot={slotKey}
      data-slot-selected={selected ? "true" : "false"}
      onClick={(event) => onSelect(event.currentTarget)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {children}

      <div
        className={`pointer-events-none absolute inset-0 z-20 rounded-lg transition-all duration-200 ring-inset ${
          selected
            ? "ring-2 ring-pink-500"
            : "ring-1 ring-transparent group-hover:ring-2 group-hover:ring-pink-400/60 group-focus:ring-2 group-focus:ring-pink-400/60"
        }`}
        aria-hidden
      />

      {showOverlay && (
        <div className="pointer-events-none absolute inset-0 z-[21] flex items-center justify-center rounded-lg bg-black/5">
          <span className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-md">
            کلیک برای انتخاب - دابل کلیک روی متن برای ویرایش
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute left-2 top-2 z-30 flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-slate-600 shadow-sm">
        <Pencil className="h-3 w-3 text-slate-500" aria-hidden />
        {label}
      </div>
    </div>
  );
}
