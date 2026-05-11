"use client";

/**
 * Local-state media upload hooks for the create-post flow. Replaces the
 * storefront's Jotai-backed `useUpload` with a leaner per-page pair:
 *
 * - `useCoverUpload()` — manages exactly one file (the post cover).
 * - `useGalleryUpload()` — manages an ordered list of files (the post media).
 *
 * Both expose object-URL previews and revoke them on unmount / replace to
 * avoid leaking blob memory. Upload work is deferred to the publish step so
 * the user doesn't pay the network cost while editing.
 */

import { arrayMove } from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isVideoFile, UploadService } from "@/services/upload.service";

function makePreview(file: File): string {
  return URL.createObjectURL(file);
}

function revokeIfBlob(url: string | null) {
  if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
}

export type CoverUploadController = {
  file: File | null;
  preview: string | null;
  uploadedId: number | null;
  isUploading: boolean;
  hasMedia: boolean;
  setFile: (file: File) => void;
  clear: () => void;
  /** Resolves with the uploaded media id (uploading if not already done). */
  upload: () => Promise<number>;
};

export function useCoverUpload(): CoverUploadController {
  const [file, setFileState] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedId, setUploadedId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(
    () => () => {
      revokeIfBlob(preview);
    },
    [preview],
  );

  const setFile = useCallback((next: File) => {
    setPreview((prev) => {
      revokeIfBlob(prev);
      return makePreview(next);
    });
    setFileState(next);
    setUploadedId(null);
  }, []);

  const clear = useCallback(() => {
    setPreview((prev) => {
      revokeIfBlob(prev);
      return null;
    });
    setFileState(null);
    setUploadedId(null);
  }, []);

  const upload = useCallback(async (): Promise<number> => {
    if (uploadedId != null) return uploadedId;
    if (!file) throw new Error("ابتدا یک تصویر کاور انتخاب کنید.");
    setIsUploading(true);
    try {
      const records = await UploadService.uploadFile(file);
      const first = records[0];
      if (!first) throw new Error("سرور پاسخی برای کاور برنگرداند.");
      setUploadedId(first.id);
      return first.id;
    } finally {
      setIsUploading(false);
    }
  }, [file, uploadedId]);

  return {
    file,
    preview,
    uploadedId,
    isUploading,
    hasMedia: file != null,
    setFile,
    clear,
    upload,
  };
}

export type GalleryItem = {
  /** Stable id for `@dnd-kit/sortable` `SortableContext`. */
  id: string;
  file: File;
  preview: string;
  uploadedId: number | null;
  /**
   * Resolved from the browser-reported MIME type at insertion time. Used by
   * the gallery card to render `<video>` instead of `<Image>` for video items.
   */
  isVideo: boolean;
};

export type GalleryUploadController = {
  items: readonly GalleryItem[];
  isUploading: boolean;
  hasMedia: boolean;
  add: (files: readonly File[]) => void;
  remove: (id: string) => void;
  reorder: (fromIndex: number, toIndex: number) => void;
  /** Resolves with all media ids in current display order. */
  uploadAll: () => Promise<number[]>;
};

let galleryItemSeq = 0;
function nextGalleryItemId(): string {
  galleryItemSeq += 1;
  return `g${Date.now().toString(36)}-${galleryItemSeq}`;
}

export function useGalleryUpload(): GalleryUploadController {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const itemsRef = useRef<GalleryItem[]>(items);
  itemsRef.current = items;

  useEffect(
    () => () => {
      for (const it of itemsRef.current) {
        revokeIfBlob(it.preview);
      }
    },
    [],
  );

  const add = useCallback((files: readonly File[]) => {
    if (files.length === 0) return;
    const next = files.map<GalleryItem>((file) => ({
      id: nextGalleryItemId(),
      file,
      preview: makePreview(file),
      uploadedId: null,
      isVideo: isVideoFile(file),
    }));
    setItems((prev) => [...prev, ...next]);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) revokeIfBlob(target.preview);
      return prev.filter((it) => it.id !== id);
    });
  }, []);

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setItems((prev) => arrayMove(prev, fromIndex, toIndex));
  }, []);

  const uploadAll = useCallback(async (): Promise<number[]> => {
    const snapshot = itemsRef.current;
    if (snapshot.length === 0) return [];
    setIsUploading(true);
    try {
      const ids = await Promise.all(
        snapshot.map(async (item) => {
          if (item.uploadedId != null) return item.uploadedId;
          const records = await UploadService.uploadFile(item.file);
          const first = records[0];
          if (!first) throw new Error("یکی از تصاویر گالری آپلود نشد.");
          return first.id;
        }),
      );
      setItems((prev) =>
        prev.map((it, i) =>
          it.uploadedId == null && i < ids.length ? { ...it, uploadedId: ids[i]! } : it,
        ),
      );
      return ids;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return useMemo(
    () => ({
      items,
      isUploading,
      hasMedia: items.length > 0,
      add,
      remove,
      reorder,
      uploadAll,
    }),
    [items, isUploading, add, remove, reorder, uploadAll],
  );
}
