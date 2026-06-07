"use client";

import React, { useRef, useState } from "react";
import { ImageIcon, UploadCloud, X } from "lucide-react";
import toast from "react-hot-toast";
import { uploadFile } from "@/services/super-admin/files/upload";
import resolveAssetUrl from "@/utils/resolveAssetUrl";

type UploadedImageShape = {
  formats?: {
    large?: { url?: string };
    medium?: { url?: string };
    small?: { url?: string };
    thumbnail?: { url?: string };
  };
  url?: string;
};

const getBestUrl = (image?: UploadedImageShape, preferOriginal = false): string => {
  if (!image) return "";
  if (preferOriginal && image.url) return image.url;
  return (
    image.formats?.large?.url ||
    image.formats?.medium?.url ||
    image.formats?.small?.url ||
    image.formats?.thumbnail?.url ||
    image.url ||
    ""
  );
};

type Props = {
  value?: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  helper?: React.ReactNode;
  /** Use the original Strapi upload URL instead of a smaller responsive format. */
  preferOriginal?: boolean;
  /** Upload with higher fidelity compression for large banners. */
  highQuality?: boolean;
  /** Accessible label for the URL text input (used in tests and screen readers). */
  urlInputAriaLabel?: string;
};

export default function ImageUploadField({
  value = "",
  onChange,
  readOnly,
  placeholder,
  helper,
  preferOriginal = false,
  highQuality = false,
  urlInputAriaLabel = "آدرس تصویر",
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (file?: File) => {
    if (!file || readOnly) return;
    setIsUploading(true);
    try {
      const uploaded = await uploadFile(file, { highQuality });
      if (uploaded && uploaded.length > 0) {
        const img = uploaded[0];
        const bestUrl = getBestUrl(img, preferOriginal);
        onChange(bestUrl || "");
        toast.success("تصویر با موفقیت بارگذاری شد");
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error("Image upload failed", err);
      toast.error("خطا در آپلود تصویر");
    } finally {
      setIsUploading(false);
      setIsDragging(false);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFileSelect(e.target.files?.[0]);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    await handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const handleRemove = () => {
    if (readOnly) return;
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const hasImage = Boolean(value?.trim());
  const previewUrl = hasImage ? resolveAssetUrl(value.trim()) : "";

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div
        className={`relative min-w-0 overflow-hidden rounded-2xl border border-dashed ${
          isDragging ? "border-infinity-primary-light bg-infinity-primary-lighter/20" : "border-slate-200 bg-slate-50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!readOnly) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {hasImage ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="پیش نمایش تصویر"
              className="h-56 w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            {!readOnly && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={readOnly}
            className="flex h-56 w-full flex-col items-center justify-center gap-2 text-slate-500 transition hover:text-slate-600"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div className="text-sm">برای آپلود کلیک کنید یا تصویر را بکشید</div>
            <div className="text-xs text-slate-400">فرمت های PNG, JPG, WEBP</div>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={readOnly || isUploading}
          className="inline-flex items-center gap-2 rounded-lg border border-infinity-primary-lighter/60 bg-white px-3 py-2 text-xs font-medium text-infinity-primary transition hover:bg-infinity-primary-lighter/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UploadCloud className="h-4 w-4" />
          {isUploading ? "در حال آپلود..." : "آپلود تصویر"}
        </button>

        {hasImage && !readOnly && (
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
            حذف تصویر
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">آدرس تصویر</label>
        <input
          type="text"
          aria-label={urlInputAriaLabel}
          value={value}
          disabled={readOnly}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`text-sm w-full rounded-lg border border-neutral-200 px-4 py-3 ${
            readOnly ? "text-slate-500" : ""
          }`}
        />
      </div>

      {helper && <div className="text-xs text-slate-500">{helper}</div>}
    </div>
  );
}
