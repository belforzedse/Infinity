"use client";

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, Plus, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, GripVertical } from "lucide-react";
import type { HeroSlideConfig } from "@/types/super-admin/heroSlider";

type SlideListProps = {
  slides: HeroSlideConfig[];
  selectedSlideId: string | null;
  onSelectSlide: (slideId: string) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (slideId: string) => void;
  onDeleteSlide: (slideId: string) => void;
  onReorderSlides: (slides: HeroSlideConfig[]) => void;
  orientation?: "vertical" | "horizontal";
};

type SlideRowProps = {
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

function SortableSlideRow({
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

export default function SlideList({
  slides,
  selectedSlideId,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onReorderSlides,
  orientation = "vertical",
}: SlideListProps) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!active?.id || !over?.id || active.id === over.id) return;

    const oldIndex = slides.findIndex((slide) => slide.id === active.id);
    const newIndex = slides.findIndex((slide) => slide.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(slides, oldIndex, newIndex).map((slide, index) => ({
      ...slide,
      order: index,
    }));

    onReorderSlides(reordered);
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;

    const reordered = arrayMove(slides, index, target).map((slide, i) => ({
      ...slide,
      order: i,
    }));
    onReorderSlides(reordered);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">
          {orientation === "horizontal" ? "نوار اسلایدها" : "اسلایدها"}
        </h2>
        <button
          type="button"
          onClick={onAddSlide}
          className="inline-flex items-center gap-1 rounded-lg bg-pink-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-pink-600"
        >
          <Plus className="h-3.5 w-3.5" />
          افزودن اسلاید
        </button>
      </div>

      {slides.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
          هنوز اسلایدی ثبت نشده است. اولین اسلاید را اضافه کنید.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={slides.map((slide) => slide.id)}
            strategy={orientation === "horizontal" ? horizontalListSortingStrategy : verticalListSortingStrategy}
          >
            <div className={orientation === "horizontal" ? "flex gap-2 overflow-x-auto pb-1" : "space-y-2"}>
              {slides.map((slide, index) => (
                <SortableSlideRow
                  key={slide.id}
                  slide={slide}
                  isSelected={slide.id === selectedSlideId}
                  index={index}
                  total={slides.length}
                  onSelect={() => onSelectSlide(slide.id)}
                  onDuplicate={() => onDuplicateSlide(slide.id)}
                  onDelete={() => onDeleteSlide(slide.id)}
                  onMoveUp={() => handleMove(index, -1)}
                  onMoveDown={() => handleMove(index, 1)}
                  orientation={orientation}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
