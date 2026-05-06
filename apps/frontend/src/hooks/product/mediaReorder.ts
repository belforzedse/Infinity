import { arrayMove } from "@dnd-kit/sortable";

type MediaAttributes = {
  mime?: string | null;
};

type MediaRecord = {
  id?: number | string;
  mime?: string | null;
  attributes?: MediaAttributes | null;
};

export type UploadMediaEntry = string | number | MediaRecord;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const reorderArrayWithGuards = <T>(
  items: T[],
  oldIndex: number,
  newIndex: number,
): T[] => {
  if (
    oldIndex === newIndex ||
    oldIndex < 0 ||
    newIndex < 0 ||
    oldIndex >= items.length ||
    newIndex >= items.length
  ) {
    return items;
  }

  return arrayMove(items, oldIndex, newIndex);
};

export const extractMediaMime = (entry: unknown): string | null => {
  if (!isRecord(entry)) return null;

  if (typeof entry.mime === "string") {
    return entry.mime;
  }

  if (isRecord(entry.attributes) && typeof entry.attributes.mime === "string") {
    return entry.attributes.mime;
  }

  return null;
};

export const isImageMediaEntry = (entry: unknown): boolean =>
  extractMediaMime(entry)?.startsWith("image/") ?? false;

export const hasTypedMediaMime = (media: unknown[]): boolean =>
  media.some((item) => typeof extractMediaMime(item) === "string");

export const reorderImageMediaPreservingSlots = <T>(
  media: T[],
  oldImageIndex: number,
  newImageIndex: number,
  isImageItem: (item: T) => boolean = (item) => isImageMediaEntry(item),
): T[] => {
  const imagePositions: number[] = [];
  const imageItems: T[] = [];

  media.forEach((item, index) => {
    if (isImageItem(item)) {
      imagePositions.push(index);
      imageItems.push(item);
    }
  });

  if (imageItems.length === 0) {
    return media;
  }

  const reorderedImageItems = reorderArrayWithGuards(imageItems, oldImageIndex, newImageIndex);
  if (reorderedImageItems === imageItems) {
    return media;
  }

  const nextMedia = [...media];
  imagePositions.forEach((position, index) => {
    nextMedia[position] = reorderedImageItems[index];
  });

  return nextMedia;
};

export const shouldReorderUntypedMediaAsImages = ({
  mediaLength,
  imageCount,
  videoCount,
}: {
  mediaLength: number;
  imageCount: number;
  videoCount: number;
}): boolean => videoCount === 0 && mediaLength === imageCount && imageCount > 0;
