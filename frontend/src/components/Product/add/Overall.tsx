import Details from "@/components/Product/add/Details";
import PhotoUploader from "@/components/Product/add/PhotoUploader";
import FileUploader from "./FileUploader";
import { EditProductData, ProductData } from "@/types/super-admin/products";
import { MediaDataItem } from "@/services/super-admin/product/get";

interface OverallProps {
  productData?: EditProductData;
  isEditMode?: boolean;
}

export default function Overall({
  productData,
  isEditMode = false,
}: OverallProps) {
  // Extract media by type
  if (process.env.NODE_ENV !== "production") {
    console.log("productData", productData);
  }

  const images =
    productData?.Media?.filter((media) =>
      media.attributes.mime.startsWith("image/"),
    ).map((media) => media.attributes.url) || [];

  const videos =
    productData?.Media?.filter((media) =>
      media.attributes.mime.startsWith("video/"),
    ).map((media) => media.attributes.url) || [];

  const files = productData?.Files?.map((file) => file.attributes.url) || [];

  return (
    <div className="flex w-full flex-col gap-4">
      <Details isEditMode={isEditMode} />

      <PhotoUploader initialImages={images} isEditMode={isEditMode} />

      <FileUploader
        title="ویدیوها"
        fileType="video"
        iconSrc="/images/video-icon.png"
        initialFiles={videos}
        isEditMode={isEditMode}
      />

      <FileUploader
        title="فایل‌ها"
        fileType="other"
        iconSrc="/images/pdf-icon.png"
        initialFiles={files}
        isEditMode={isEditMode}
      />
    </div>
  );
}
