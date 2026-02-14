"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Copy, GripVertical, Trash2 } from "lucide-react";
import type { HeroSlideConfig } from "@/types/super-admin/heroSlider";

export type SlideRowProps = {
  slide: HeroSlideConfig;
  isSelected: boolean;
  index: number;
  total: number;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  orientation: "vertical" | "horizontal";
};

export default function SortableSlideRow({
  slide,
  isSelected,
  index,
  total,
  onSelect,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  orientation,
}: SlideRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: slide.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border p-3 ${
        orientation === "horizontal" ? "min-w-[250px] max-w-[250px] shrink-0" : ""
      } ${
        isSelected ? "border-pink-400 bg-pink-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-2 text-right"
        >
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
              slide.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {index + 1}
          </span>
          <span className="truncate text-sm font-medium text-slate-800">
            {slide.id || `اسلاید ${index + 1}`}
          </span>
        </button>

        <button
          type="button"
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          aria-label="جابجایی اسلاید"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="rounded-md p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          aria-label={orientation === "horizontal" ? "انتقال اسلاید به چپ" : "انتقال اسلاید به بالا"}
        >
          {orientation === "horizontal" ? <ArrowLeft className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="rounded-md p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          aria-label={orientation === "horizontal" ? "انتقال اسلاید به راست" : "انتقال اسلاید به پایین"}
        >
          {orientation === "horizontal" ? (
            <ArrowRight className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="rounded-md p-1 text-slate-600 hover:bg-slate-100"
          aria-label="تکثیر اسلاید"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md p-1 text-rose-600 hover:bg-rose-50"
          aria-label="حذف اسلاید"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
