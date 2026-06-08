"use client";

import { useRef, useState } from "react";
import { ImageIcon, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import resolveAssetUrl from "@/utils/resolveAssetUrl";
import { uploadFile } from "@/services/super-admin/files/upload";

export type CategoryImageValue = {
  id?: number;
  url?: string;
};

type Props = {
  image?: CategoryImageValue;
  onImageChange: (value: CategoryImageValue | undefined) => void;
};

export default function CategoryAppearancePanel({ image, onImageChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploaded = await uploadFile(file, { highQuality: true });
      if (uploaded && uploaded.length > 0) {
        const img = uploaded[0];
        const bestUrl =
          img.url ||
          img.formats?.large?.url ||
          img.formats?.medium?.url ||
          img.formats?.small?.url ||
          img.formats?.thumbnail?.url;
        onImageChange({ id: img.id, url: bestUrl });
        toast.success("تصویر دسته‌بندی با موفقیت بارگذاری شد");
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error("Category image upload failed", err);
      toast.error("خطا در آپلود تصویر دسته‌بندی");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onImageChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
          <ImageIcon className="h-4 w-4 text-slate-500" />
        </div>
        <span className="text-sm font-medium text-neutral-800">تصویر دسته‌بندی</span>
      </div>

      <div className="flex flex-col gap-3">
        {image?.url ? (
          <div className="relative aspect-[227/310] overflow-hidden rounded-3xl">
            <img
              src={resolveAssetUrl(image.url)}
              alt="تصویر دسته‌بندی"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
              aria-label="حذف تصویر"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-[227/310] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-infinity-primary-lighter hover:bg-infinity-primary-lighter/20"
          >
            <ImageIcon className="mb-2 h-8 w-8 text-slate-400" />
            <span className="text-sm text-slate-500">بارگذاری تصویر دسته‌بندی</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex items-center justify-end gap-2">
          {isUploading && <span className="text-xs text-slate-500">در حال آپلود...</span>}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 text-xs text-infinity-primary hover:text-infinity-primary"
            disabled={isUploading}
          >
            <Plus className="h-4 w-4" />
            <span>انتخاب عکس جدید</span>
          </button>
        </div>
      </div>
    </div>
  );
}
