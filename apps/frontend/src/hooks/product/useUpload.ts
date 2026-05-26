import imageCompression from "browser-image-compression";
import { uploadFile } from "@/services/super-admin/files/upload";
import { useEffect, useRef } from "react";
import logger from "@/utils/logger";
import toast from "react-hot-toast";
import { atom, useAtom } from "jotai";
import { editProductDataAtom, productDataAtom } from "@/atoms/super-admin/products";
import type { FileType } from "@/components/Product/add/FileUploader/types";
import type { UploadStatus } from "@/components/Product/add/UploadStatusBadge";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";
import { generateStableId } from "@/utils/stableId";
import {
  hasTypedMediaMime,
  reorderArrayWithGuards,
  reorderImageMediaPreservingSlots,
  shouldReorderUntypedMediaAsImages,
  type UploadMediaEntry,
} from "./mediaReorder";

interface UploadingState {
  image: boolean;
  video: boolean;
  other: boolean;
}

export const uploadingStateAtom = atom<UploadingState>({
  image: false,
  video: false,
  other: false,
});

export interface FileWithPreview {
  id: string;
  file: File;
  preview: string;
  uploadStatus: UploadStatus;
  uploadError?: string | null;
}

interface UseUploadProps {
  initialImages?: string[];
  initialVideos?: string[];
  initialFiles?: string[];
  isEditMode?: boolean;
}

const imagesAtom = atom<FileWithPreview[]>([]);
const videosAtom = atom<FileWithPreview[]>([]);
const filesAtom = atom<FileWithPreview[]>([]);

const cleanupObjectURLs = (items: FileWithPreview[]) => {
  items.forEach((item) => {
    if (item?.preview?.startsWith("blob:")) {
      URL.revokeObjectURL(item.preview);
    }
  });
};

const mapUrlsToFileWithPreview = (urls: string[], placeholderName: string) =>
  urls.map((url, index) => ({
    id: generateStableId(`${placeholderName}-`),
    file: new File([], `${placeholderName}-${index}`),
    preview: url,
    uploadStatus: "uploaded" as const,
    uploadError: null,
  }));

const resolveMediaRemovalIndex = (
  media: any[],
  filteredIndex: number,
  mimePrefix: "image/" | "video/",
) => {
  const indexedMedia = media
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item?.attributes?.mime?.startsWith(mimePrefix));

  if (indexedMedia.length > 0) {
    return indexedMedia[filteredIndex]?.index ?? null;
  }

  return filteredIndex;
};

export function useUpload({
  initialImages,
  initialVideos,
  initialFiles,
  isEditMode = false,
}: UseUploadProps = {}) {
  const [images, setImages] = useAtom(imagesAtom);
  const [videos, setVideos] = useAtom(videosAtom);
  const [files, setFiles] = useAtom(filesAtom);

  const [uploadingState, setUploadingState] = useAtom(uploadingStateAtom);
  const [productData, setProductData] = useAtom(isEditMode ? editProductDataAtom : productDataAtom);

  const previousImageKeyRef = useRef<string | null>(null);
  const previousVideoKeyRef = useRef<string | null>(null);
  const previousFileKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialImages === undefined) return;
    const normalizedImages = initialImages ?? [];
    const nextKey = JSON.stringify(normalizedImages);

    if (previousImageKeyRef.current === nextKey) return;
    previousImageKeyRef.current = nextKey;

    cleanupObjectURLs(images);
    setImages(mapUrlsToFileWithPreview(normalizedImages, "image"));
  }, [initialImages, images, setImages]);

  useEffect(() => {
    if (initialVideos === undefined) return;
    const normalizedVideos = initialVideos ?? [];
    const nextKey = JSON.stringify(normalizedVideos);

    if (previousVideoKeyRef.current === nextKey) return;
    previousVideoKeyRef.current = nextKey;

    cleanupObjectURLs(videos);
    setVideos(mapUrlsToFileWithPreview(normalizedVideos, "video"));
  }, [initialVideos, videos, setVideos]);

  useEffect(() => {
    if (initialFiles === undefined) return;
    const normalizedFiles = initialFiles ?? [];
    const nextKey = JSON.stringify(normalizedFiles);

    if (previousFileKeyRef.current === nextKey) return;
    previousFileKeyRef.current = nextKey;

    cleanupObjectURLs(files);
    setFiles(mapUrlsToFileWithPreview(normalizedFiles, "file"));
  }, [initialFiles, files, setFiles]);

  const getFileType = (file: File): "image" | "video" | "other" => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    return "other";
  };

  const createPreview = (file: File): string => {
    const fileType = getFileType(file);
    if (fileType === "image" || fileType === "video") {
      return URL.createObjectURL(file);
    }
    return "/file-icon.png";
  };

  const optimizeImage = async (file: File): Promise<File> => {
    try {
      const optimized = await imageCompression(file, {
        maxSizeMB: 256,
        maxWidthOrHeight: 10920,
        useWebWorker: true,
        fileType: file.type,
      });
      return optimized;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Image optimization failed, uploading original file", error);
      }
      return file;
    }
  };

  const updateItemById = (
    type: FileType,
    id: string,
    patch: Partial<Pick<FileWithPreview, "uploadStatus" | "uploadError">>,
  ) => {
    const updater = (items: FileWithPreview[]) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item));

    if (type === "image") {
      setImages(updater);
    } else if (type === "video") {
      setVideos(updater);
    } else {
      setFiles(updater);
    }
  };

  const addItem = (type: FileType, item: FileWithPreview) => {
    if (type === "image") {
      setImages((prevImages) => [...prevImages, item]);
    } else if (type === "video") {
      setVideos((prevVideos) => [...prevVideos, item]);
    } else {
      setFiles((prevFiles) => [...prevFiles, item]);
    }
  };

  const getItemsByType = (type: FileType) => {
    if (type === "image") return images;
    if (type === "video") return videos;
    return files;
  };

  const uploadedIndexBefore = (items: FileWithPreview[], index: number) =>
    items.slice(0, index).filter((item) => item.uploadStatus === "uploaded").length;

  const uploadVisibleFile = async (item: FileWithPreview, targetType: FileType) => {
    const detectedFileType = getFileType(item.file);

    if (targetType === "image" && detectedFileType !== "image") {
      throw new Error("فقط بارگذاری تصاویر در این بخش مجاز است");
    }

    if (targetType === "video" && detectedFileType !== "video") {
      throw new Error("فایل ویدیویی معتبر نیست");
    }

    let uploadSource: File = item.file;

    if (detectedFileType === "image") {
      const optimizedBlob = await optimizeImage(item.file);
      uploadSource = new File([optimizedBlob], item.file.name, {
        type: optimizedBlob.type,
      });
    }

    const response = await uploadFile(uploadSource);
    if (!response?.[0]) {
      throw new Error("خطا در آپلود فایل");
    }

    if (process.env.NODE_ENV !== "production") {
      logger.info("response", { response });
    }

    if (detectedFileType === "image" || detectedFileType === "video") {
      setProductData((prev: any) => ({
        // TODO: Replace `any` usage with ProductData type
        ...prev,
        Media: [
          ...((prev as any).Media || []),
          isEditMode ? { id: response[0].id, attributes: response[0] } : response[0].id.toString(),
        ],
      }));
    } else {
      setProductData((prev: any) => ({
        // TODO: Replace `any` usage with ProductData type
        ...prev,
        Files: [
          ...((prev as any).Files || []),
          isEditMode ? { id: response[0].id, attributes: response[0] } : response[0].id.toString(),
        ],
      }));
    }

    updateItemById(targetType, item.id, {
      uploadStatus: "uploaded",
      uploadError: null,
    });
  };

  // TODO: Revoke object URLs on unmount to avoid memory leaks

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: FileType) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;

    setUploadingState((prev) => ({ ...prev, [fileType]: true }));
    const uploadErrors: string[] = [];
    let totalSuccessful = 0;

    try {
      for (const file of newFiles) {
        const fileWithPreview: FileWithPreview = {
          id: generateStableId(`${fileType}-upload-`),
          file,
          preview: createPreview(file),
          uploadStatus: "uploading",
          uploadError: null,
        };

        addItem(fileType, fileWithPreview);

        try {
          await uploadVisibleFile(fileWithPreview, fileType);
          totalSuccessful += 1;
        } catch (error: any) {
          const friendlyMessage = getUserFacingErrorMessage(error, "خطا در آپلود فایل‌ها");
          updateItemById(fileType, fileWithPreview.id, {
            uploadStatus: "failed",
            uploadError: friendlyMessage,
          });
          uploadErrors.push(`${file.name}: ${friendlyMessage}`);
        }
      }

      if (totalSuccessful > 0) {
        if (totalSuccessful === newFiles.length) {
          toast.success("همه فایل‌ها با موفقیت آپلود شدند");
        } else {
          toast(`${totalSuccessful} از ${newFiles.length} فایل با موفقیت آپلود شدند`, {
            icon: "⚠️",
          });
        }
      }

      if (uploadErrors.length > 0) {
        uploadErrors.forEach((error) => {
          toast.error(error);
        });
      }
    } catch (error: any) {
      toast.error("خطا در آپلود فایل‌ها. لطفا دوباره تلاش کنید.");
      console.error("Error uploading files:", error);
    } finally {
      setUploadingState((prev) => ({ ...prev, [fileType]: false }));
      e.target.value = "";
    }
  };

  const retryFile = async (index: number, type: FileType) => {
    const item = getItemsByType(type)[index];
    if (!item || item.uploadStatus !== "failed") return;

    updateItemById(type, item.id, {
      uploadStatus: "uploading",
      uploadError: null,
    });
    setUploadingState((prev) => ({ ...prev, [type]: true }));

    try {
      await uploadVisibleFile(item, type);
      toast.success("فایل با موفقیت آپلود شد");
    } catch (error: any) {
      const friendlyMessage = getUserFacingErrorMessage(error, "خطا در آپلود فایل");
      updateItemById(type, item.id, {
        uploadStatus: "failed",
        uploadError: friendlyMessage,
      });
      toast.error(`${item.file.name}: ${friendlyMessage}`);
    } finally {
      setUploadingState((prev) => ({ ...prev, [type]: false }));
    }
  };

  const removeFile = (index: number, type: "image" | "video" | "other") => {
    switch (type) {
      case "image":
        if (images[index]?.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(images[index].preview);
        }
        setImages((prevImages) => prevImages.filter((_, i) => i !== index));
        if (productData) {
          if (images[index]?.uploadStatus !== "uploaded") break;
          const media = ((productData as any).Media || []) as any[];
          const uploadedIndex = uploadedIndexBefore(images, index);
          const removalIndex = isEditMode
            ? resolveMediaRemovalIndex(media, uploadedIndex, "image/")
            : uploadedIndex;
          if (removalIndex !== null) {
            setProductData({
              ...(productData as any), // TODO: Strongly type productData
              Media: media.filter((_: any, i: number) => i !== removalIndex),
            });
          }
        }
        break;
      case "video":
        if (videos[index]?.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(videos[index].preview);
        }
        setVideos((prevVideos) => prevVideos.filter((_, i) => i !== index));
        if (productData) {
          if (videos[index]?.uploadStatus !== "uploaded") break;
          const media = ((productData as any).Media || []) as any[];
          const uploadedIndex = uploadedIndexBefore(videos, index);
          const removalIndex = isEditMode
            ? resolveMediaRemovalIndex(media, uploadedIndex, "video/")
            : uploadedIndex;
          if (removalIndex !== null) {
            setProductData({
              ...(productData as any), // TODO: Strongly type productData
              Media: media.filter((_: any, i: number) => i !== removalIndex),
            });
          }
        }
        break;
      case "other":
        if (files[index]?.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(files[index].preview);
        }
        setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
        if (productData) {
          if (files[index]?.uploadStatus !== "uploaded") break;
          const uploadedIndex = uploadedIndexBefore(files, index);
          setProductData({
            ...(productData as any), // TODO: Strongly type productData
            Files: ((productData as any).Files || []).filter(
              (_: any, i: number) => i !== uploadedIndex,
            ),
          });
        }
        break;
    }
  };

  const reorderImages = (oldIndex: number, newIndex: number) => {
    setImages((prevImages) => reorderArrayWithGuards(prevImages, oldIndex, newIndex));

    setProductData((prev: any) => {
      // TODO: Replace cast with strongly typed product data
      if (!prev) return prev;

      const media = (((prev as any).Media || []) as UploadMediaEntry[]);
      if (!Array.isArray(media) || media.length === 0) {
        return prev;
      }

      if (!images.every((image) => image.uploadStatus === "uploaded")) {
        return prev;
      }

      let nextMedia = media;

      // Edit mode media includes MIME metadata and can be reordered as an image subset.
      if (isEditMode || hasTypedMediaMime(media)) {
        nextMedia = reorderImageMediaPreservingSlots(media, oldIndex, newIndex);
      } else if (
        shouldReorderUntypedMediaAsImages({
          mediaLength: media.length,
          imageCount: images.filter((image) => image.uploadStatus === "uploaded").length,
          videoCount: videos.filter((video) => video.uploadStatus === "uploaded").length,
        })
      ) {
        // Add mode fallback when every media entry is currently an image.
        nextMedia = reorderArrayWithGuards(media, oldIndex, newIndex);
      }

      if (nextMedia === media) {
        return prev;
      }

      return {
        ...(prev as any),
        Media: nextMedia,
      };
    });
  };

  return {
    images,
    videos,
    files,
    uploadingState,
    handleFileUpload,
    removeFile,
    retryFile,
    reorderImages,
  };
}
