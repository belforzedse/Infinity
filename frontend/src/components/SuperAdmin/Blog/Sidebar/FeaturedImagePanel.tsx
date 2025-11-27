"use client";

import React, { useRef, useState } from "react";
import { ImageIcon, Plus, X } from "lucide-react";
import { IMAGE_BASE_URL } from "@/constants/api";
import { uploadFile } from "@/services/super-admin/files/upload";
import toast from "react-hot-toast";

export interface FeaturedImageValue {
  id?: number;
  url?: string;
}

interface FeaturedImagePanelProps {
  featuredImage?: FeaturedImageValue;
  onFeaturedImageChange: (value: FeaturedImageValue | undefined) => void;
  onUploadImage?: () => void;
}

export default function FeaturedImagePanel({
  featuredImage,
  onFeaturedImageChange,
  onUploadImage,
}: FeaturedImagePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploaded = await uploadFile(file);
      if (uploaded && uploaded.length > 0) {
        const img = uploaded[0];
        onFeaturedImageChange({ id: img.id, url: img.url });
        toast.success("تصویر با موفقیت بارگذاری شد");
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error("Image upload failed", err);
      toast.error("خطا در آپلود تصویر");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onFeaturedImageChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getImageUrl = (url: string) => {
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    return `${IMAGE_BASE_URL}${url}`;
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
            <ImageIcon className="h-4 w-4 text-slate-500" />
          </div>
          <span className="text-sm font-medium text-neutral-800">تصویر شاخص</span>
        </div>
      </div>

      {/* Image Preview or Upload Area */}
      {featuredImage?.url ? (
        <div className="relative">
          <img
            src={getImageUrl(featuredImage.url)}
            alt="تصویر شاخص"
            className="h-48 w-full rounded-xl object-cover"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-pink-300 hover:bg-pink-50"
        >
          <ImageIcon className="mb-2 h-8 w-8 text-slate-400" />
          <span className="text-sm text-slate-500">کلیک کنید یا تصویر را بکشید</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Change Image Link */}
      <div className="flex items-center justify-end gap-2">
        {isUploading && <span className="text-xs text-slate-500">در حال آپلود...</span>}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-end gap-1 text-xs text-pink-500 hover:text-pink-600"
          disabled={isUploading}
        >
          <Plus className="h-4 w-4" />
          <span>انتخاب عکس جدید</span>
        </button>
      </div>
    </div>
  );
}


