import React from "react";
import PhotoUploaderImagePreview from "./ImagePreview";
export interface ImageGridProps {
  previews: string[];
  onRemoveFile: (index: number, type: "image" | "video" | "other") => void;
}

const PhotoUploaderImageGrid: React.FC<ImageGridProps> = ({
  previews,
  onRemoveFile,
}) => (
  <div className="border border-dashed border-blue-600 rounded-xl px-6 py-4 min-h-44">
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {previews.map((preview, index) => (
        <PhotoUploaderImagePreview
          key={index}
          preview={preview}
          index={index}
          onRemove={() => onRemoveFile(index, "image")}
        />
      ))}
    </div>
  </div>
);

export default PhotoUploaderImageGrid;
