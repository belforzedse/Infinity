import Details from "@/components/Product/add/Details";
import PhotoUploader from "@/components/Product/add/PhotoUploader";
import VideoUploader from "@/components/Product/add/VideoUploader";
import FileUploader from "./FileUploader";
import type { EditProductData } from "@/types/super-admin/products";
import logger from "@/utils/logger";
import resolveAssetUrl from "@/utils/resolveAssetUrl";

interface OverallProps {
  productData?: EditProductData;
  isEditMode?: boolean;
}

export default function Overall({ productData, isEditMode = false }: OverallProps) {
  // Extract media by type
  if (process.env.NODE_ENV !== "production") {
    logger.info("productData", { productData });
  }

  // Temporarily hide advanced media uploaders in the super-admin UI.
  const showMediaUploaders = false;

  const images =
    productData?.Media?.filter((media) => media.attributes.mime?.startsWith("image/"))
      .map((media) => resolveAssetUrl(media.attributes.url))
      .filter(Boolean) || [];

  const videos =
    productData?.Media?.filter((media) => media.attributes.mime?.startsWith("video/"))
      .map((media) => resolveAssetUrl(media.attributes.url))
      .filter(Boolean) || [];

  const files = productData?.Files?.map((file) => resolveAssetUrl(file.attributes.url)).filter(Boolean) || [];

  return (
    <div className="flex w-full flex-col gap-4">
      <Details isEditMode={isEditMode} />

      <PhotoUploader initialImages={images} isEditMode={isEditMode} />

      <VideoUploader initialVideos={videos} isEditMode={isEditMode} />

      {showMediaUploaders && (
        <>
          <FileUploader
            title="فایل‌ها"
            fileType="other"
            iconSrc="/images/pdf-icon.png"
            initialFiles={files}
            isEditMode={isEditMode}
          />
        </>
      )}
    </div>
  );
}
