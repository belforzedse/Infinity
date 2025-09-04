import { useState, useRef, useEffect } from "react";
import { uploadFile } from "@/services/super-admin/files/upload";
import { useAtom } from "jotai";
import {
  editProductDataAtom,
  productDataAtom,
} from "@/atoms/super-admin/products";
import toast from "react-hot-toast";
import { Download } from "@/services/super-admin/files/download";
import { IMAGE_BASE_URL } from "@/constants/api";
import { usePathname } from "next/navigation";

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
  isUploading: boolean;
}

const useIndexImageUpload = ({
  onImageUpload,
  onImageDelete,
  isEditMode = false,
}: UseIndexImageUploadProps): UseIndexImageUploadReturn => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(
    null,
  ) as React.RefObject<HTMLInputElement>;
  const [productData, setProductData] = useAtom(
    isEditMode ? editProductDataAtom : productDataAtom,
  );
  const pathname = usePathname();

  useEffect(() => {
    if (
      productData.CoverImage?.data?.attributes?.url &&
      !pathname.endsWith("/add")
    ) {
      setImagePreview(
        IMAGE_BASE_URL + productData.CoverImage.data.attributes.url,
      );
    }
  }, [productData.CoverImage, pathname]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const response = await uploadFile(file);
        if (response && response[0]) {
          if (!pathname.endsWith("/add")) {
            setImagePreview(IMAGE_BASE_URL + response[0].url);
          } else {
            const reader = new FileReader();
            reader.onloadend = () => {
              setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
          }

          setProductData({
            ...(productData as any),
            CoverImage: {
              data: {
                id: response[0].id,
                attributes: response[0],
              },
            },
          });
          onImageUpload?.(file);
          toast.success("تصویر شاخص با موفقیت آپلود شد");
        }
      } catch (error: any) {
        toast.error("خطا در آپلود تصویر شاخص");
        console.error("Error uploading index image:", error);
        handleDelete();
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDelete = () => {
    setImagePreview(null);
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
    try {
      if (!productData.CoverImage?.data?.id) {
        toast.error("تصویری انتخاب نشده است");
        return;
      }
      const response = await Download(
        productData.CoverImage.data.id.toString(),
      );
      if (response?.url) {
        window.open(IMAGE_BASE_URL + response.url, "_blank", "noopener,noreferrer");
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
    isUploading,
  };
};

export default useIndexImageUpload;
