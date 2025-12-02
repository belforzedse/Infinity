import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Kits/Modal";
import type { SelectedImageDetailsSection, TabType } from "./types";
import Sidebar from "./components/Sidebar";
import MediaUploader from "./components/MediaUploader";
import DeleteIcon from "@/components/Kits/Icons/DeleteIcon";
import DetailsSection from "./components/DetailSection";
import ImageDialog, { type ImageFormValues } from "@/components/RichTextEditor/ImageDialog";

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MediaUploadModal({ isOpen, onClose }: MediaUploadModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("افزودن رسانه");
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImageDetailsSection | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setMediaPickerOpen(false);
    }
  }, [isOpen]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImage({
      name: imageUrl.split("/").pop() || "",
      url: imageUrl,
    });
  };

  const mediaPickerInitialValues: ImageFormValues = useMemo(
    () => ({
      src: selectedImage?.url || "",
      title: selectedImage?.name || "",
      alt: selectedImage?.name || "",
    }),
    [selectedImage],
  );

  const handleMediaPickerSubmit = (values: ImageFormValues) => {
    setSelectedImage({
      name: values.title || values.alt || values.src.split("/").pop() || "تصویر",
      url: values.src,
      size: values.width && values.height ? `${values.width} × ${values.height}` : selectedImage?.size,
    });
    setMediaPickerOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-7xl !bg-slate-50"
      closeIcon={<DeleteIcon className="text-pink-500" />}
      titleClassName="!justify-end"
    >
      <div className="grid h-full min-h-[600px] grid-cols-5 gap-3">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <MediaUploader
          dragActive={dragActive}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onImageSelect={handleImageSelect}
        />

        <DetailsSection
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          onPickFromLibrary={() => setMediaPickerOpen(true)}
        />
      </div>
      <ImageDialog
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        initialValues={mediaPickerInitialValues}
        onSubmit={handleMediaPickerSubmit}
      />
    </Modal>
  );
}
