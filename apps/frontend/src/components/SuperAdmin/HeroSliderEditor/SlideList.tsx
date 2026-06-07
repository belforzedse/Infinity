"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { HeroSlideConfig } from "@/types/super-admin/heroSliderV3";
import SortableSlideRow from "./SortableSlideRow";

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

  const handleDragEnd = (event: DragEndEvent) => {
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
          className="inline-flex items-center gap-1 rounded-lg bg-infinity-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-infinity-primary"
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
