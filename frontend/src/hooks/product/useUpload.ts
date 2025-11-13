import imageCompression from "browser-image-compression";
import { uploadFile } from "@/services/super-admin/files/upload";
import { useEffect } from "react"; // removed unused: useState
import logger from "@/utils/logger";
import toast from "react-hot-toast";
import { useAtom } from "jotai";
import { editProductDataAtom, productDataAtom } from "@/atoms/super-admin/products";
import { atom } from "jotai";
import type { FileType } from "@/components/Product/add/FileUploader/types";

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
  file: File;
  preview: string;
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

export function useUpload({
  initialImages = [],
  initialVideos = [],
  initialFiles = [],
  isEditMode = false,
}: UseUploadProps = {}) {
  // States for all file types
  const [images, setImages] = useAtom(imagesAtom);
  const [videos, setVideos] = useAtom(videosAtom);
  const [files, setFiles] = useAtom(filesAtom);

  const [uploadingState, setUploadingState] = useAtom(uploadingStateAtom);
  const [productData, setProductData] = useAtom(isEditMode ? editProductDataAtom : productDataAtom);

  // Initialize with initial files if provided
  useEffect(() => {
    if (initialImages.length > 0 && !images.length) {
      const imageFiles = initialImages.map((url) => ({
        file: new File([], "image.jpg"),
        preview: url,
      }));
      setImages(imageFiles);
    }

    if (initialVideos.length > 0 && !videos.length) {
      const videoFiles = initialVideos.map((url) => ({
        file: new File([], "video.mp4"),
        preview: url,
      }));
      setVideos(videoFiles);
    }

    if (initialFiles.length > 0 && !files.length) {
      const otherFiles = initialFiles.map((url) => ({
        file: new File([], "file"),
        preview: url,
      }));
      setFiles(otherFiles);
    }
  }, [
    initialImages,
    initialVideos,
    initialFiles,
    images.length,
    videos.length,
    files.length,
    setImages,
    setVideos,
    setFiles,
  ]);

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

  // TODO: Revoke object URLs on unmount to avoid memory leaks

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: FileType) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;

    setUploadingState((prev) => ({ ...prev, [fileType]: true }));
    const uploadErrors: string[] = [];
    const successfulImages: FileWithPreview[] = [];
    const successfulVideos: FileWithPreview[] = [];
    const successfulFiles: FileWithPreview[] = [];

    try {
      for (const file of newFiles) {
        try {
          const currentFileType = getFileType(file);
          const previewUrl = createPreview(file);
          let uploadSource: File = file;

          if (currentFileType === "image") {
            const optimizedBlob = await optimizeImage(file);
            // Preserve original filename when uploading optimized images
            uploadSource = new File([optimizedBlob], file.name, {
              type: optimizedBlob.type,
            });
          }

          const response = await uploadFile(uploadSource);

          if (response) {
            // Update Media or Files array in productData based on file type
            if (process.env.NODE_ENV !== "production") {
              logger.info("response", { response });
            }

            if (currentFileType === "image" || currentFileType === "video") {
              setProductData((prev: any) => ({
                // TODO: Replace `any` usage with ProductData type
                ...prev,
                Media: [
                  ...((prev as any).Media || []),
                  isEditMode
                    ? { id: response[0].id, attributes: response[0] }
                    : response[0].id.toString(),
                ],
              }));
            } else {
              setProductData((prev: any) => ({
                // TODO: Replace `any` usage with ProductData type
                ...prev,
                Files: [
                  ...((prev as any).Files || []),
                  isEditMode
                    ? { id: response[0].id, attributes: response[0] }
                    : response[0].id.toString(),
                ],
              }));
            }

            const fileWithPreview = {
              file,
              preview: previewUrl,
            };

            // Sort files by type into appropriate arrays
            switch (currentFileType) {
              case "image":
                successfulImages.push(fileWithPreview);
                break;
              case "video":
                successfulVideos.push(fileWithPreview);
                break;
              case "other":
                successfulFiles.push(fileWithPreview);
                break;
            }
          }
        } catch (error: any) {
          // TODO: Narrow error type instead of using `any`
          uploadErrors.push(`${file.name}: ${error.message}`);
        }
      }

      // Update states with successful uploads
      if (successfulImages.length > 0) {
        setImages((prevImages) => [...prevImages, ...successfulImages]);
      }

      if (successfulVideos.length > 0) {
        setVideos((prevVideos) => [...prevVideos, ...successfulVideos]);
      }

      if (successfulFiles.length > 0) {
        setFiles((prevFiles) => [...prevFiles, ...successfulFiles]);
      }

      const totalSuccessful =
        successfulImages.length + successfulVideos.length + successfulFiles.length;

      if (totalSuccessful > 0) {
        if (totalSuccessful === newFiles.length) {
          toast.success("همه فایل‌ها با موفقیت آپلود شدند");
        } else {
          toast(`${totalSuccessful} از ${newFiles.length} فایل با موفقیت آپلود شدند`, {
            icon: "⚠️",
          });
        }
      }

      // Show errors if any
      if (uploadErrors.length > 0) {
        uploadErrors.forEach((error) => {
          toast.error(error);
        });
      }
    } catch (error: any) {
      // TODO: Provide a typed error object
      toast.error("خطا در آپلود فایل‌ها. لطفا دوباره تلاش کنید.");
      console.error("Error uploading files:", error);
    } finally {
      setUploadingState((prev) => ({ ...prev, [fileType]: false }));
    }
  };

  const removeFile = (index: number, type: "image" | "video" | "other") => {
    switch (type) {
      case "image":
        URL.revokeObjectURL(images[index].preview);
        setImages((prevImages) => prevImages.filter((_, i) => i !== index));
        setProductData({
          ...(productData as any), // TODO: Strongly type productData
          Media: (productData as any).Media.filter((_: any, i: number) => i !== index),
        });
        break;
      case "video":
        URL.revokeObjectURL(videos[index].preview);
        setVideos((prevVideos) => prevVideos.filter((_, i) => i !== index));
        setProductData({
          ...(productData as any), // TODO: Strongly type productData
          Media: (productData as any).Media.filter((_: any, i: number) => i !== index),
        });
        break;
      case "other":
        URL.revokeObjectURL(files[index].preview);
        setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
        setProductData({
          ...(productData as any), // TODO: Strongly type productData
          Files: (productData as any).Files.filter((_: any, i: number) => i !== index),
        });
        break;
    }
  };

  return {
    images,
    videos,
    files,
    uploadingState,
    handleFileUpload,
    removeFile,
  };
}
