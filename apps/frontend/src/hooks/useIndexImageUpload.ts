import { useState, useRef, useEffect } from "react";
import { uploadFile } from "@/services/super-admin/files/upload";
import { useAtom } from "jotai";
import { editProductDataAtom, productDataAtom } from "@/atoms/super-admin/products";
import toast from "react-hot-toast";
import { Download } from "@/services/super-admin/files/download";
import { usePathname } from "next/navigation";
import { resolveAssetUrl } from "@/utils/resolveAssetUrl";
import type { UploadStatus } from "@/components/Product/add/UploadStatusBadge";

interface UseIndexImageUploadProps {
  onImageUpload?: (file: File) => void;
  onImageDelete?: () => void;
  isEditMode?: boolean;
}

interface UseIndexImageUploadReturn {
  imagePreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleDelete: () => void;
  handlePreviewClick: () => void;
  retryUpload: () => void;
  isUploading: boolean;
  uploadStatus: UploadStatus;
  uploadError: string | null;
  previewMimeType?: string;
}

const useIndexImageUpload = ({
  onImageUpload,
  onImageDelete,
  isEditMode = false,
}: UseIndexImageUploadProps): UseIndexImageUploadReturn => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;
  const lastFileRef = useRef<File | null>(null);
  const [productData, setProductData] = useAtom(isEditMode ? editProductDataAtom : productDataAtom);
  const pathname = usePathname();

  useEffect(() => {
    if (productData.CoverImage?.data?.attributes?.url && !pathname.endsWith("/add")) {
      setImagePreview(resolveAssetUrl(productData.CoverImage.data.attributes.url));
      setUploadStatus("uploaded");
      setUploadError(null);
    }
  }, [productData.CoverImage, pathname]);

  const setLocalPreview = (file: File) => {
    setPreviewMimeType(file.type);
    if (file.type.startsWith("video/")) {
      setImagePreview(URL.createObjectURL(file));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadSelectedFile = async (file: File) => {
    setIsUploading(true);
    setUploadStatus("uploading");
    setUploadError(null);

    try {
      const response = await uploadFile(file);
      if (!response?.[0]) {
        throw new Error("خطا در آپلود تصویر/ویدیوی شاخص");
      }

      if (!pathname.endsWith("/add")) {
        setImagePreview(resolveAssetUrl(response[0].url));
      }

      setProductData((prev: any) => ({
        ...(prev as any),
        // TODO: Replace cast with proper product type
        CoverImage: {
          data: {
            id: response[0].id,
            attributes: response[0],
          },
        },
      }));
      onImageUpload?.(file);
      setUploadStatus("uploaded");
      setUploadError(null);
      const isVideo = file.type.startsWith("video/");
      toast.success(isVideo ? "ویدیوی شاخص با موفقیت آپلود شد" : "تصویر شاخص با موفقیت آپلود شد");
    } catch (error: any) {
      // TODO: Define a proper error type instead of using `any`
      const message = error?.message || "خطا در آپلود تصویر/ویدیوی شاخص";
      setUploadStatus("failed");
      setUploadError(message);
      toast.error(message);
      console.error("Error uploading index image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    lastFileRef.current = file;
    setLocalPreview(file);
    await uploadSelectedFile(file);
    event.target.value = "";
  };

  const retryUpload = () => {
    if (!lastFileRef.current || uploadStatus !== "failed") return;
    void uploadSelectedFile(lastFileRef.current);
  };

  const handleDelete = () => {
    setImagePreview(null);
    setPreviewMimeType(undefined);
    setUploadStatus("idle");
    setUploadError(null);
    lastFileRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setProductData({
      ...(productData as any),
      CoverImage: {
        data: null,
      },
    });
    onImageDelete?.();
  };

  const handlePreviewClick = async () => {
    if (imagePreview) {
      window.open(imagePreview, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      const fileId = productData.CoverImage?.data?.id;
      if (!fileId) {
        toast.error("تصویری انتخاب نشده است");
        return;
      }
      const response = await Download(fileId.toString());
      if (response?.url) {
        window.open(resolveAssetUrl(response.url), "_blank", "noopener,noreferrer");
      } else {
        toast.error("آدرس تصویر در دسترس نیست");
      }
    } catch (error) {
      console.error("Error previewing image:", error);
      toast.error("خطا در نمایش تصویر");
    }
  };

  return {
    imagePreview,
    fileInputRef,
    handleImageUpload,
    handleDelete,
    handlePreviewClick,
    retryUpload,
    isUploading,
    uploadStatus,
    uploadError,
    previewMimeType,
  };
};

export default useIndexImageUpload;
