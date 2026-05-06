"use client";

import React, { useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { Upload, X, ToggleLeft, ToggleRight } from "lucide-react";
import type { StoryMediaType, CreateStoryData } from "@/types/story";
import { uploadFile } from "@/services/super-admin/files/upload";
import { IMAGE_BASE_URL } from "@/constants/api";

export interface StoryFormValues {
  Title: string;
  IsActive: boolean;
  SortOrder: number;
  MediaType: StoryMediaType;
  mediaId?: number;
  mediaUrl?: string;
  thumbnailId?: number;
  thumbnailUrl?: string;
}

interface StoryFormProps {
  initialValues?: Partial<StoryFormValues>;
  onSubmit: (data: CreateStoryData) => Promise<void>;
  isLoading: boolean;
  submitLabel: string;
}

export default function StoryForm({ initialValues, onSubmit, isLoading, submitLabel }: StoryFormProps) {
  const [title, setTitle] = useState(initialValues?.Title ?? "");
  const [isActive, setIsActive] = useState(initialValues?.IsActive ?? false);
  const [sortOrder, setSortOrder] = useState(initialValues?.SortOrder ?? 0);

  const [mediaId, setMediaId] = useState<number | undefined>(initialValues?.mediaId);
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(initialValues?.mediaUrl);
  const [mediaType, setMediaType] = useState<StoryMediaType>(initialValues?.MediaType ?? "image");

  const [thumbnailId, setThumbnailId] = useState<number | undefined>(initialValues?.thumbnailId);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(initialValues?.thumbnailUrl);

  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const mediaInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const handleMediaUpload = useCallback(async (file: File) => {
    setUploadingMedia(true);
    try {
      const result = await uploadFile(file);
      if (result?.[0]) {
        setMediaId(result[0].id);
        setMediaUrl(result[0].url);
        setMediaType(file.type.startsWith("video/") ? "video" : "image");
      }
    } catch {
      toast.error("خطا در آپلود رسانه. دوباره تلاش کنید.");
    } finally {
      setUploadingMedia(false);
    }
  }, []);

  const handleThumbnailUpload = useCallback(async (file: File) => {
    setUploadingThumb(true);
    try {
      const result = await uploadFile(file);
      if (result?.[0]) {
        setThumbnailId(result[0].id);
        setThumbnailUrl(result[0].url);
      }
    } catch {
      toast.error("خطا در آپلود تصویر جلد. دوباره تلاش کنید.");
    } finally {
      setUploadingThumb(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("عنوان الزامی است."); return; }
    if (!mediaId) { toast.error("آپلود رسانه الزامی است."); return; }

    await onSubmit({
      Title: title.trim(),
      MediaType: mediaType,
      IsActive: isActive,
      SortOrder: sortOrder,
      Media: mediaId,
      Thumbnail: thumbnailId,
    });
  };

  function fullUrl(url?: string) {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    const base = (IMAGE_BASE_URL || "").replace(/\/+$/, "");
    const path = url.replace(/^\/+/, "");
    if (!base) return `/${path}`;
    return `${base}/${path}`;
  }

  return (
    <form onSubmit={handleSubmit} dir="rtl" className="grid grid-cols-1 gap-6 lg:grid-cols-3">

      {/* ── Main column ───────────────────────── */}
      <div className="space-y-5 lg:col-span-2">

        {/* Title */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            عنوان <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان استوری..."
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
            required
          />
        </div>

        {/* Media */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <label className="mb-3 block text-sm font-medium text-slate-700">
            رسانه (تصویر یا ویدیو) <span className="text-red-500">*</span>
          </label>

          {mediaUrl ? (
            <div className="relative inline-block">
              {mediaType === "video" ? (
                <video src={fullUrl(mediaUrl)} className="h-48 w-auto rounded-xl" controls />
              ) : (
                <img src={fullUrl(mediaUrl)} alt="media" className="h-48 w-auto rounded-xl object-cover" />
              )}
              <button
                type="button"
                onClick={() => { setMediaId(undefined); setMediaUrl(undefined); }}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              disabled={uploadingMedia}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-10 text-slate-400 transition-colors hover:border-pink-300 hover:text-pink-400"
            >
              <Upload className="h-8 w-8" />
              <span className="text-sm">
                {uploadingMedia ? "در حال آپلود..." : "کلیک کنید یا فایل را اینجا بکشید"}
              </span>
              <span className="text-xs text-slate-300">تصویر یا ویدیو</span>
            </button>
          )}
          <input
            ref={mediaInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMediaUpload(f); }}
          />
        </div>

        {/* Cover image */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <label className="mb-3 block text-sm font-medium text-slate-700">تصویر جلد</label>
          <p className="mb-3 text-xs text-slate-400">نمایش داده می‌شود روی حلقه استوری در صفحه اصلی</p>

          {thumbnailUrl ? (
            <div className="relative inline-block">
              <img
                src={fullUrl(thumbnailUrl)}
                alt="cover"
                className="h-32 w-32 rounded-xl object-cover"
              />
              <button
                type="button"
                onClick={() => { setThumbnailId(undefined); setThumbnailUrl(undefined); }}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => thumbInputRef.current?.click()}
              disabled={uploadingThumb}
              className="flex w-40 flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-6 text-slate-400 hover:border-pink-300 hover:text-pink-400"
            >
              <Upload className="h-6 w-6" />
              <span className="text-xs">{uploadingThumb ? "آپلود..." : "آپلود تصویر جلد"}</span>
            </button>
          )}
          <input
            ref={thumbInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbnailUpload(f); }}
          />
        </div>
      </div>

      {/* ── Sidebar ───────────────────────────── */}
      <div className="space-y-5">

        {/* Publish + save */}
        <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">وضعیت انتشار</span>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className="flex items-center gap-2 text-sm"
            >
              {isActive ? (
                <><ToggleRight className="h-6 w-6 text-green-500" /><span className="text-green-600 font-medium">منتشر شده</span></>
              ) : (
                <><ToggleLeft className="h-6 w-6 text-slate-400" /><span className="text-slate-500">پیش‌نویس</span></>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-pink-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:opacity-60"
          >
            {isLoading ? "در حال ذخیره..." : submitLabel}
          </button>
        </div>

        {/* Sort order */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-slate-700">ترتیب نمایش</label>
          <p className="mb-2 text-xs text-slate-400">عدد کمتر = نمایش اول</p>
          <input
            type="number"
            value={sortOrder}
            min={0}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-pink-400 focus:outline-none"
          />
        </div>
      </div>
    </form>
  );
}
