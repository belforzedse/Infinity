import { uploadFile } from "@/services/super-admin/files/upload";
import { useEffect } from "react"; // removed unused: useState
import toast from "react-hot-toast";
import { useAtom } from "jotai";
import {
  editProductDataAtom,
  productDataAtom,
} from "@/atoms/super-admin/products";
import { atom } from "jotai";
import { FileType } from "@/components/Product/add/FileUploader/types";

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
  const [productData, setProductData] = useAtom(
    isEditMode ? editProductDataAtom : productDataAtom,
  );

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
  }, [initialImages, initialVideos, initialFiles]);

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

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: FileType,
  ) => {
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
          const fileType = getFileType(file);
          const previewUrl = createPreview(file);
          const response = await uploadFile(file);

          if (response) {
            // Update Media or Files array in productData based on file type
            if (process.env.NODE_ENV !== "production") {
              console.log("response", response);
            }

            if (fileType === "image" || fileType === "video") {
              setProductData((prev: any) => ({
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
            switch (fileType) {
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
        successfulImages.length +
        successfulVideos.length +
        successfulFiles.length;

      if (totalSuccessful > 0) {
        if (totalSuccessful === newFiles.length) {
          toast.success("همه فایل‌ها با موفقیت آپلود شدند");
        } else {
          toast(
            `${totalSuccessful} از ${newFiles.length} فایل با موفقیت آپلود شدند`,
            {
              icon: "⚠️",
            },
          );
        }
      }

      // Show errors if any
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
    }
  };

  const removeFile = (index: number, type: "image" | "video" | "other") => {
    switch (type) {
      case "image":
        URL.revokeObjectURL(images[index].preview);
        setImages((prevImages) => prevImages.filter((_, i) => i !== index));
        setProductData({
          ...(productData as any),
          Media: (productData as any).Media.filter(
            (_: any, i: number) => i !== index,
          ),
        });
        break;
      case "video":
        URL.revokeObjectURL(videos[index].preview);
        setVideos((prevVideos) => prevVideos.filter((_, i) => i !== index));
        setProductData({
          ...(productData as any),
          Media: (productData as any).Media.filter(
            (_: any, i: number) => i !== index,
          ),
        });
        break;
      case "other":
        URL.revokeObjectURL(files[index].preview);
        setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
        setProductData({
          ...(productData as any),
          Files: (productData as any).Files.filter(
            (_: any, i: number) => i !== index,
          ),
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
