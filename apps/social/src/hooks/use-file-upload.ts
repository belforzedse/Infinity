"use client";

/**
 * Local-state media upload hooks for the create-post flow. Replaces the
 * storefront's Jotai-backed `useUpload` with a leaner per-page pair:
 *
 * - `useCoverUpload()` manages exactly one file (the post cover).
 * - `useGalleryUpload()` manages an ordered list of files (the post media).
 *
 * Both expose object-URL previews and revoke them on unmount / replace to
 * avoid leaking blob memory. Newly selected media starts uploading immediately;
 * publishing only reads completed upload ids.
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

export type UploadStatus = "idle" | "uploading" | "uploaded" | "failed";

export type ExistingUploadedMedia = {
  id: number;
  preview: string;
  isVideo?: boolean;
};

export type CoverUploadController = {
  file: File | null;
  preview: string | null;
  uploadedId: number | null;
  uploadStatus: UploadStatus;
  uploadError: string | null;
  isUploading: boolean;
  hasFailed: boolean;
  allUploaded: boolean;
  hasMedia: boolean;
  setFile: (file: File) => void;
  setExisting: (media: ExistingUploadedMedia | null) => void;
  clear: () => void;
  retry: () => void;
  /** Resolves with the uploaded media id if upload has already completed. */
  upload: () => Promise<number>;
};

export function useCoverUpload(initialMedia?: ExistingUploadedMedia | null): CoverUploadController {
  const [file, setFileState] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialMedia?.preview ?? null);
  const [uploadedId, setUploadedId] = useState<number | null>(initialMedia?.id ?? null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(
    initialMedia?.id != null ? "uploaded" : "idle",
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileRef = useRef<File | null>(null);
  const uploadedIdRef = useRef<number | null>(initialMedia?.id ?? null);
  const uploadSeqRef = useRef(0);

  useEffect(
    () => () => {
      revokeIfBlob(preview);
    },
    [preview],
  );

  const runUpload = useCallback(async (target: File, seq: number): Promise<number | null> => {
    setUploadStatus("uploading");
    setUploadError(null);

    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const records = await UploadService.uploadFile(target);
        const first = records[0];
        if (!first) throw new Error("سرور پاسخی برای کاور برنگرداند.");
        if (uploadSeqRef.current !== seq) return null;

        uploadedIdRef.current = first.id;
        setUploadedId(first.id);
        setUploadStatus("uploaded");
        setUploadError(null);
        return first.id;
      } catch (error) {
        lastError = error;
      }
    }

    if (uploadSeqRef.current === seq) {
      uploadedIdRef.current = null;
      setUploadedId(null);
      setUploadStatus("failed");
      setUploadError("آپلود کاور ناموفق بود. دوباره تلاش کنید.");
    }

    throw lastError instanceof Error ? lastError : new Error("Upload failed");
  }, []);

  const setFile = useCallback((next: File) => {
    const seq = uploadSeqRef.current + 1;
    uploadSeqRef.current = seq;
    fileRef.current = next;

    setPreview((prev) => {
      revokeIfBlob(prev);
      return makePreview(next);
    });
    setFileState(next);
    uploadedIdRef.current = null;
    setUploadedId(null);
    void runUpload(next, seq).catch(() => undefined);
  }, [runUpload]);

  const setExisting = useCallback((media: ExistingUploadedMedia | null) => {
    uploadSeqRef.current += 1;
    fileRef.current = null;

    setPreview((prev) => {
      revokeIfBlob(prev);
      return media?.preview ?? null;
    });
    setFileState(null);
    uploadedIdRef.current = media?.id ?? null;
    setUploadedId(media?.id ?? null);
    setUploadStatus(media?.id != null ? "uploaded" : "idle");
    setUploadError(null);
  }, []);

  const clear = useCallback(() => {
    uploadSeqRef.current += 1;
    fileRef.current = null;

    setPreview((prev) => {
      revokeIfBlob(prev);
      return null;
    });
    setFileState(null);
    uploadedIdRef.current = null;
    setUploadedId(null);
    setUploadStatus("idle");
    setUploadError(null);
  }, []);

  const retry = useCallback(() => {
    const target = fileRef.current;
    if (!target) return;

    const seq = uploadSeqRef.current + 1;
    uploadSeqRef.current = seq;
    uploadedIdRef.current = null;
    setUploadedId(null);
    void runUpload(target, seq).catch(() => undefined);
  }, [runUpload]);

  const upload = useCallback(async (): Promise<number> => {
    if (uploadedIdRef.current != null) return uploadedIdRef.current;
    if (!fileRef.current) throw new Error("ابتدا یک تصویر کاور انتخاب کنید.");
    if (uploadStatus === "uploading") throw new Error("آپلود کاور هنوز کامل نشده است.");
    throw new Error("آپلود کاور ناموفق بود. دوباره تلاش کنید.");
  }, [uploadStatus]);

  const hasMedia = file != null || uploadedId != null;
  const isUploading = uploadStatus === "uploading";

  return {
    file,
    preview,
    uploadedId,
    uploadStatus,
    uploadError,
    isUploading,
    hasFailed: uploadStatus === "failed",
    allUploaded: !hasMedia || uploadedId != null,
    hasMedia,
    setFile,
    setExisting,
    clear,
    retry,
    upload,
  };
}

export type GalleryItem = {
  /** Stable id for `@dnd-kit/sortable` `SortableContext`. */
  id: string;
  file: File | null;
  preview: string;
  uploadedId: number | null;
  uploadStatus: UploadStatus;
  uploadError: string | null;
  /**
   * Resolved from the browser-reported MIME type at insertion time. Used by
   * the gallery card to render `<video>` instead of `<Image>` for video items.
   */
  isVideo: boolean;
};

export type GalleryUploadController = {
  items: readonly GalleryItem[];
  isUploading: boolean;
  hasFailed: boolean;
  allUploaded: boolean;
  uploadedIds: readonly number[];
  hasMedia: boolean;
  add: (files: readonly File[]) => void;
  setExisting: (media: readonly ExistingUploadedMedia[]) => void;
  remove: (id: string) => void;
  reorder: (fromIndex: number, toIndex: number) => void;
  retry: (id: string) => void;
  /** Resolves with all media ids in current display order if uploads completed. */
  uploadAll: () => Promise<number[]>;
};

let galleryItemSeq = 0;
function nextGalleryItemId(): string {
  galleryItemSeq += 1;
  return `g${Date.now().toString(36)}-${galleryItemSeq}`;
}

function existingGalleryItem(media: ExistingUploadedMedia): GalleryItem {
  return {
    id: `existing-${media.id}`,
    file: null,
    preview: media.preview,
    uploadedId: media.id,
    uploadStatus: "uploaded",
    uploadError: null,
    isVideo: media.isVideo === true,
  };
}

export function useGalleryUpload(initialMedia: readonly ExistingUploadedMedia[] = []): GalleryUploadController {
  const [items, setItems] = useState<GalleryItem[]>(() => initialMedia.map(existingGalleryItem));
  const itemsRef = useRef<GalleryItem[]>(items);
  const itemUploadSeqRef = useRef<Map<string, number>>(new Map());
  itemsRef.current = items;

  useEffect(
    () => () => {
      for (const it of itemsRef.current) {
        revokeIfBlob(it.preview);
      }
    },
    [],
  );

  const runItemUpload = useCallback(async (id: string, target: File) => {
    const seq = (itemUploadSeqRef.current.get(id) ?? 0) + 1;
    itemUploadSeqRef.current.set(id, seq);

    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, uploadedId: null, uploadStatus: "uploading", uploadError: null }
          : it,
      ),
    );

    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const records = await UploadService.uploadFile(target);
        const first = records[0];
        if (!first) throw new Error("یکی از تصاویر گالری آپلود نشد.");
        if (itemUploadSeqRef.current.get(id) !== seq) return;
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? { ...it, uploadedId: first.id, uploadStatus: "uploaded", uploadError: null }
              : it,
          ),
        );
        return;
      } catch (error) {
        lastError = error;
      }
    }

    if (itemUploadSeqRef.current.get(id) !== seq) return;
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              uploadedId: null,
              uploadStatus: "failed",
              uploadError: "آپلود این رسانه ناموفق بود. دوباره تلاش کنید.",
            }
          : it,
      ),
    );

    throw lastError instanceof Error ? lastError : new Error("Upload failed");
  }, []);

  const add = useCallback((files: readonly File[]) => {
    if (files.length === 0) return;
    const next = files.map<GalleryItem>((file) => ({
      id: nextGalleryItemId(),
      file,
      preview: makePreview(file),
      uploadedId: null,
      uploadStatus: "uploading",
      uploadError: null,
      isVideo: isVideoFile(file),
    }));
    setItems((prev) => [...prev, ...next]);
    for (const item of next) {
      if (item.file) void runItemUpload(item.id, item.file).catch(() => undefined);
    }
  }, [runItemUpload]);

  const setExisting = useCallback((media: readonly ExistingUploadedMedia[]) => {
    itemUploadSeqRef.current.clear();
    setItems((prev) => {
      for (const it of prev) {
        revokeIfBlob(it.preview);
      }
      return media.map(existingGalleryItem);
    });
  }, []);

  const remove = useCallback((id: string) => {
    itemUploadSeqRef.current.delete(id);
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

  const retry = useCallback((id: string) => {
    const target = itemsRef.current.find((it) => it.id === id);
    if (!target?.file || target.uploadStatus === "uploading") return;
    void runItemUpload(id, target.file).catch(() => undefined);
  }, [runItemUpload]);

  const uploadAll = useCallback(async (): Promise<number[]> => {
    const snapshot = itemsRef.current;
    if (snapshot.length === 0) return [];
    if (snapshot.some((item) => item.uploadStatus === "uploading")) {
      throw new Error("آپلود رسانه ها هنوز کامل نشده است.");
    }
    if (snapshot.some((item) => item.uploadStatus === "failed" || item.uploadedId == null)) {
      throw new Error("آپلود یکی از رسانه ها ناموفق بود. دوباره تلاش کنید.");
    }
    return snapshot.map((item) => item.uploadedId as number);
  }, []);

  const isUploading = items.some((item) => item.uploadStatus === "uploading");
  const hasFailed = items.some((item) => item.uploadStatus === "failed");
  const allUploaded = items.length > 0 && items.every((item) => item.uploadedId != null);
  const uploadedIds = items
    .map((item) => item.uploadedId)
    .filter((id): id is number => id != null);

  return useMemo(
    () => ({
      items,
      isUploading,
      hasFailed,
      allUploaded,
      uploadedIds,
      hasMedia: items.length > 0,
      add,
      setExisting,
      remove,
      reorder,
      retry,
      uploadAll,
    }),
    [
      items,
      isUploading,
      hasFailed,
      allUploaded,
      uploadedIds,
      add,
      setExisting,
      remove,
      reorder,
      retry,
      uploadAll,
    ],
  );
}
