import classNames from "classnames";
import { useState } from "react";
import Uploader from "./Uploader";
import type { MediaViewType } from "../types";
import { MediaViewEnum } from "../types";
import { UploadedPhotosSelector } from "./UploadedPhotosSelector";

interface MediaUploaderProps {
  dragActive: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onImageSelect: (image: string) => void;
}

export default function MediaUploader({
  dragActive,
  onDragOver,
  onDragLeave,
  onDrop,
  onImageSelect,
}: MediaUploaderProps) {
  const [activeView, setActiveView] = useState<MediaViewType>(MediaViewEnum.UPLOAD_FILES);

  const views: MediaViewType[] = [
    MediaViewEnum.UPLOAD_FILES,
    MediaViewEnum.UPLOAD_MULTIPLE_FILES,
    MediaViewEnum.SHOW_DETAILS,
  ];

  return (
    <div className="col-span-3 flex flex-1 flex-col overflow-hidden rounded-lg bg-white px-5 py-4">
      {/* View Selector */}
      <div className="flex gap-8 border-b border-gray-200">
        {views.map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={classNames(
              "text-sm border-b-2 pb-2 transition-colors",
              view === activeView
                ? "border-pink-500 text-pink-500"
                : "border-transparent text-gray-500 hover:text-gray-700",
            )}
          >
            {view}
          </button>
        ))}
      </div>

      {activeView === MediaViewEnum.UPLOAD_FILES && (
        <Uploader
          dragActive={dragActive}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        />
      )}

      {activeView === MediaViewEnum.UPLOAD_MULTIPLE_FILES && (
        <UploadedPhotosSelector
          onPhotoSelect={(photo) => {
            onImageSelect(photo);
          }}
          selectedPhotos={[]}
        />
      )}
    </div>
  );
}
