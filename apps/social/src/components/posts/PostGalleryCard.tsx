"use client";

/**
 * Multi-image gallery upload card for the create-post flow.
 *
 * Ports the structure of the storefront `PhotoUploader` + `PhotoUploader/ImageGrid`
 * (`apps/frontend/src/components/Product/add/PhotoUploader/*`) into the social
 * app: white rounded card with a header row, blue outline "اضافه کردن" upload
 * trigger, and a dashed-blue container hosting a responsive grid of preview
 * tiles. Pointer + keyboard drag-to-reorder via `@dnd-kit`. Storefront pinks
 * are recoloured to the social blue family throughout.
 */

import { useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { GripVertical, Plus, Video as VideoIcon, X } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
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
import type { GalleryItem, GalleryUploadController } from "@/hooks/use-file-upload";
import {
  MAX_VIDEO_BYTES,
  isImageFile,
  isVideoFile,
} from "@/services/upload.service";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const HEADER_TITLE = "تصاویر و ویدیوها";
const ADD_BUTTON_LABEL = "اضافه کردن";
const EMPTY_STATE_HINT =
  "حداقل یک تصویر یا ویدیو برای گالری پست بارگذاری کنید.";

const KEYBOARD_SENSOR_OPTIONS = {
  coordinateGetter: sortableKeyboardCoordinates,
} as const;

const MAX_VIDEO_MB = Math.round(MAX_VIDEO_BYTES / (1024 * 1024));

/**
 * Filter raw file picker selections down to gallery-acceptable media, surfacing
 * a Persian-friendly toast for each rejection reason. The Strapi `Media` field
 * is configured with `allowedTypes: ["images", "videos"]`, so non-media files
 * would be rejected server-side anyway — we bounce them in the browser to fail
 * fast and avoid wasted upload bandwidth.
 */
function partitionAcceptedFiles(files: readonly File[]): File[] {
  const accepted: File[] = [];
  let unsupportedCount = 0;
  let oversizedCount = 0;

  for (const file of files) {
    if (!isImageFile(file) && !isVideoFile(file)) {
      unsupportedCount += 1;
      continue;
    }
    if (isVideoFile(file) && file.size > MAX_VIDEO_BYTES) {
      oversizedCount += 1;
      continue;
    }
    accepted.push(file);
  }

  if (unsupportedCount > 0) {
    toast.error(
      `${unsupportedCount.toLocaleString("fa-IR")} فایل به دلیل فرمت پشتیبانی‌نشده اضافه نشد.`,
    );
  }
  if (oversizedCount > 0) {
    toast.error(
      `حجم ویدیو نباید بیشتر از ${MAX_VIDEO_MB.toLocaleString("fa-IR")} مگابایت باشد.`,
    );
  }

  return accepted;
}

export type PostGalleryCardProps = {
  controller: GalleryUploadController;
};

export function PostGalleryCard({ controller }: PostGalleryCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, KEYBOARD_SENSOR_OPTIONS),
  );

  const sortableIds = useMemo(
    () => controller.items.map((it) => it.id),
    [controller.items],
  );

  const handleAddClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const accepted = partitionAcceptedFiles(Array.from(files));
      if (accepted.length > 0) controller.add(accepted);
    }
    e.target.value = "";
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!active?.id || !over?.id || active.id === over.id) return;
      const oldIndex = controller.items.findIndex((it) => it.id === String(active.id));
      const newIndex = controller.items.findIndex((it) => it.id === String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;
      controller.reorder(oldIndex, newIndex);
    },
    [controller],
  );

  return (
    <div className="w-full rounded-2xl bg-white p-5 shadow-[0_0_14.7px_rgba(0,0,0,0.04)]">
      <div className="mb-4 flex flex-row-reverse items-center justify-between">
        <h3 className="font-peyda text-base text-zinc-700">{HEADER_TITLE}</h3>
        <button
          type="button"
          onClick={handleAddClick}
          className={cx(
            "flex min-w-32 cursor-pointer flex-row-reverse items-center justify-between gap-2",
            "rounded-lg border border-[#566D97] bg-[rgba(140,174,236,0.14)] px-3 py-2",
            "text-[#3D4C6E] transition-colors hover:bg-[rgba(140,174,236,0.24)]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
          )}
        >
          <span className="font-peyda text-sm">{ADD_BUTTON_LABEL}</span>
          <Plus className="size-4 stroke-[1.8]" aria-hidden />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="min-h-44 rounded-xl border border-dashed border-[#566D97] px-4 py-4 sm:px-6">
        {controller.items.length === 0 ? (
          <button
            type="button"
            onClick={handleAddClick}
            className={cx(
              "flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg",
              "bg-transparent text-[#94A3B8] transition-colors hover:bg-[rgba(140,174,236,0.08)]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
            )}
          >
            <Plus className="size-8 stroke-[1.5]" aria-hidden />
            <span className="font-peyda text-xs">{EMPTY_STATE_HINT}</span>
          </button>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {controller.items.map((item, index) => (
                  <SortableTile
                    key={item.id}
                    item={item}
                    index={index}
                    onRemove={() => controller.remove(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

type SortableTileProps = {
  item: GalleryItem;
  index: number;
  onRemove: () => void;
};

function SortableTile({ item, index, onRemove }: SortableTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const sortableTransform = CSS.Transform.toString(transform);

  const style: React.CSSProperties = {
    transform: [sortableTransform, isDragging ? "scale(1.04) rotate(1deg)" : undefined]
      .filter(Boolean)
      .join(" "),
    transition: isDragging ? "transform 160ms var(--ease-velvet)" : transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cx(
        "group relative transition-shadow duration-150 ease-[var(--ease-velvet)]",
        isDragging && "z-10 shadow-xl",
      )}
    >
      <button
        type="button"
        aria-label={`جابجایی تصویر ${index + 1}`}
        className={cx(
          "absolute left-1 top-1 z-10 flex h-7 w-7 cursor-grab items-center justify-center rounded-full",
          "border border-white/70 bg-white/90 text-zinc-500 shadow-sm transition-colors",
          "hover:text-zinc-700 active:cursor-grabbing",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4 stroke-[1.6]" aria-hidden />
      </button>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`حذف تصویر ${index + 1}`}
        className={cx(
          "absolute right-1 top-1 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full",
          "bg-[linear-gradient(180deg,#566D97_0%,#98BDFF_100%)] text-white shadow-sm",
          "transition-opacity hover:opacity-90",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
          "lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100",
        )}
      >
        <X className="size-4 stroke-[1.8]" aria-hidden />
      </button>

      <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
        {item.isVideo ? (
          <>
            {/*
              Native `<video controls>` lets the user preview inline without
              leaving the editor. `preload="metadata"` keeps the load light
              while still rendering the first frame as a poster. `muted` and
              `playsInline` are needed for the iOS Safari autoplay heuristic
              if the user taps the inline play control.
            */}
            <video
              src={item.preview}
              controls
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
              aria-label={`ویدیوی گالری ${index + 1}`}
            />
            <span
              className={cx(
                "pointer-events-none absolute bottom-1 right-1 z-10 inline-flex items-center gap-1",
                "rounded-full bg-[#3D4C6E]/85 px-2 py-0.5 text-[10px] text-white shadow-sm",
                "font-peyda",
              )}
            >
              <VideoIcon className="size-3 stroke-[2]" aria-hidden />
              ویدیو
            </span>
          </>
        ) : (
          <Image
            src={item.preview}
            alt={`تصویر گالری ${index + 1}`}
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        )}
      </div>
    </div>
  );
}
