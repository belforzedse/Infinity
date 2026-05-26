import React, { useCallback, useMemo, useRef } from "react";
import PhotoUploaderImagePreview from "@/components/Product/add/PhotoUploader/ImagePreview";
import type { FileWithPreview } from "@/hooks/product/useUpload";
import { generateStableId } from "@/utils/stableId";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface ImageGridProps {
  items: FileWithPreview[];
  onRemoveFile: (index: number) => void;
  onRetryFile?: (index: number) => void;
  onReorder?: (oldIndex: number, newIndex: number) => void;
}

interface SortablePreviewItemProps {
  id: string;
  item: FileWithPreview;
  index: number;
  onRemoveFile: (index: number) => void;
  onRetryFile?: (index: number) => void;
  sortable: boolean;
}

const SortablePreviewItem: React.FC<SortablePreviewItemProps> = ({
  id,
  item,
  index,
  onRemoveFile,
  onRetryFile,
  sortable,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
    disabled: !sortable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative" data-sortable-id={id}>
      {sortable && (
        <button
          type="button"
          className="absolute left-1 top-1 z-10 flex h-7 w-7 cursor-grab items-center justify-center rounded-full border border-white/70 bg-white/90 text-slate-500 shadow-sm hover:text-slate-700 active:cursor-grabbing lg:h-8 lg:w-8"
          aria-label={`جابجایی تصویر ${index + 1}`}
          {...attributes}
          {...listeners}
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M7 4.25A1.25 1.25 0 1 1 7 6.75a1.25 1.25 0 0 1 0-2.5Zm6 0A1.25 1.25 0 1 1 13 6.75a1.25 1.25 0 0 1 0-2.5ZM7 8.75A1.25 1.25 0 1 1 7 11.25a1.25 1.25 0 0 1 0-2.5Zm6 0A1.25 1.25 0 1 1 13 11.25a1.25 1.25 0 0 1 0-2.5ZM7 13.25A1.25 1.25 0 1 1 7 15.75a1.25 1.25 0 0 1 0-2.5Zm6 0A1.25 1.25 0 1 1 13 15.75a1.25 1.25 0 0 1 0-2.5Z" />
          </svg>
        </button>
      )}

      <PhotoUploaderImagePreview
        preview={item.preview}
        index={index}
        mimeType={item.file.type}
        uploadStatus={item.uploadStatus}
        uploadError={item.uploadError}
        onRemove={() => onRemoveFile(index)}
        onRetry={onRetryFile ? () => onRetryFile(index) : undefined}
      />
    </div>
  );
};

const KEYBOARD_SENSOR_OPTIONS = { coordinateGetter: sortableKeyboardCoordinates };

const PhotoUploaderImageGrid: React.FC<ImageGridProps> = ({
  items,
  onRemoveFile,
  onRetryFile,
  onReorder,
}) => {
  const stableIdsRef = useRef<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, KEYBOARD_SENSOR_OPTIONS),
  );

  const sortableItems = useMemo(() => {
    let ids = stableIdsRef.current;
    if (ids.length < items.length) {
      ids = [...ids];
      while (ids.length < items.length) {
        ids.push(generateStableId());
      }
      stableIdsRef.current = ids;
    } else if (ids.length > items.length) {
      // When list shrinks, trim from the end. IDs only need to be unique per drag session;
      // the DnD context resets on re-render, so dropping from the tail is intentional.
      ids = ids.slice(0, items.length);
      stableIdsRef.current = ids;
    }
    return items.map((item, index) => ({
      id: item.id || stableIdsRef.current[index],
      item,
      index,
    }));
  }, [items]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!onReorder) return;

      const { active, over } = event;
      if (!active?.id || !over?.id || active.id === over.id) return;

      const oldIndex = sortableItems.findIndex((item) => item.id === String(active.id));
      const newIndex = sortableItems.findIndex((item) => item.id === String(over.id));

      if (oldIndex < 0 || newIndex < 0) return;

      onReorder(oldIndex, newIndex);
    },
    [onReorder, sortableItems],
  );

  const grid = (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {sortableItems.map((item) => (
        <SortablePreviewItem
          key={item.id}
          id={item.id}
          item={item.item}
          index={item.index}
          onRemoveFile={onRemoveFile}
          onRetryFile={onRetryFile}
          sortable={Boolean(onReorder)}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-44 rounded-xl border border-dashed border-blue-600 px-6 py-4">
      {onReorder ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableItems.map((item) => item.id)} strategy={rectSortingStrategy}>
            {grid}
          </SortableContext>
        </DndContext>
      ) : (
        grid
      )}
    </div>
  );
};

export default PhotoUploaderImageGrid;
