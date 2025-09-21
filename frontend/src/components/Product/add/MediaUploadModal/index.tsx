import { useState } from "react";
import Modal from "@/components/Kits/Modal";
import { TabType } from "./types";
import Sidebar from "./components/Sidebar";
import MediaUploader from "./components/MediaUploader";
import DeleteIcon from "@/components/Kits/Icons/DeleteIcon";
import DetailsSection from "./components/DetailSection";

interface SelectedImage {
  name: string;
  url: string;
  size?: string;
}

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MediaUploadModal({ isOpen, onClose }: MediaUploadModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("افزودن رسانه");
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);

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

        <DetailsSection selectedImage={selectedImage} setSelectedImage={setSelectedImage} />
      </div>
    </Modal>
  );
}
