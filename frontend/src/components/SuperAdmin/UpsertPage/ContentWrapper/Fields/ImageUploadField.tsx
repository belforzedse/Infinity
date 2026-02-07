"use client";

import React, { useRef, useState } from "react";
import { ImageIcon, UploadCloud, X } from "lucide-react";
import toast from "react-hot-toast";
import { uploadFile } from "@/services/super-admin/files/upload";
import resolveAssetUrl from "@/utils/resolveAssetUrl";

const getBestUrl = (image?: { formats?: any; url?: string }) => {
  if (!image) return "";
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
};

export default function ImageUploadField({
  value = "",
  onChange,
  readOnly,
  placeholder,
  helper,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (file?: File) => {
    if (!file || readOnly) return;
    setIsUploading(true);
    try {
      const uploaded = await uploadFile(file);
      if (uploaded && uploaded.length > 0) {
        const img = uploaded[0];
        const bestUrl = getBestUrl(img);
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
    <div className="flex flex-col gap-3">
      <div
        className={`relative overflow-hidden rounded-2xl border border-dashed ${
          isDragging ? "border-pink-400 bg-pink-50" : "border-slate-200 bg-slate-50"
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
          className="inline-flex items-center gap-2 rounded-lg border border-pink-200 bg-white px-3 py-2 text-xs font-medium text-pink-600 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-60"
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
