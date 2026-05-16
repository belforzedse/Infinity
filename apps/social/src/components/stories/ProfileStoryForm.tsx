"use client";

import { useRef, useState, type FormEvent } from "react";
import { ImagePlus, ToggleLeft, ToggleRight, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { IMAGE_BASE_URL } from "@repo/api";
import { Button } from "@/components/ui/Button";
import { uploadFile } from "@/services/upload.service";
import type { CreateStoryData, StoryMediaType } from "@/types/story";

export type ProfileStoryFormValues = {
  Title: string;
  IsActive: boolean;
  SortOrder: number;
  MediaType: StoryMediaType;
  updatedAt?: string;
  mediaId?: number;
  mediaUrl?: string;
  thumbnailId?: number;
  thumbnailUrl?: string;
};

type ProfileStoryFormProps = {
  initialValues?: Partial<ProfileStoryFormValues>;
  heading: string;
  submitLabel: string;
  submittingLabel: string;
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: (data: CreateStoryData) => Promise<void>;
};

function resolveMediaUrl(url?: string, version?: string): string | undefined {
  if (!url) return undefined;
  const suffix = version ? `${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}` : "";
  if (url.startsWith("http://") || url.startsWith("https://")) return `${url}${suffix}`;
  const base = IMAGE_BASE_URL.replace(/\/+$/, "");
  const path = url.replace(/^\/+/, "");
  return `${base}/${path}${suffix}`;
}

export function ProfileStoryForm({
  initialValues,
  heading,
  submitLabel,
  submittingLabel,
  isSubmitting,
  onBack,
  onSubmit,
}: ProfileStoryFormProps) {
  const [title, setTitle] = useState(initialValues?.Title ?? "");
  const [isActive, setIsActive] = useState(initialValues?.IsActive ?? false);
  const [sortOrder, setSortOrder] = useState(initialValues?.SortOrder ?? 0);
  const [mediaType, setMediaType] = useState<StoryMediaType>(initialValues?.MediaType ?? "image");
  const [mediaId, setMediaId] = useState<number | undefined>(initialValues?.mediaId);
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(initialValues?.mediaUrl);
  const [thumbnailId, setThumbnailId] = useState<number | undefined>(initialValues?.thumbnailId);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(initialValues?.thumbnailUrl);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  async function handleMediaUpload(file: File) {
    setUploadingMedia(true);
    try {
      const [uploaded] = await uploadFile(file);
      if (!uploaded) throw new Error("Upload missing response");
      setMediaId(uploaded.id);
      setMediaUrl(uploaded.url);
      setMediaType(file.type.startsWith("video/") ? "video" : "image");
    } catch {
      toast.error("آپلود رسانه ناموفق بود.");
    } finally {
      setUploadingMedia(false);
    }
  }

  async function handleThumbnailUpload(file: File) {
    setUploadingThumbnail(true);
    try {
      const [uploaded] = await uploadFile(file);
      if (!uploaded) throw new Error("Upload missing response");
      setThumbnailId(uploaded.id);
      setThumbnailUrl(uploaded.url);
    } catch {
      toast.error("آپلود تصویر جلد ناموفق بود.");
    } finally {
      setUploadingThumbnail(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("عنوان الزامی است.");
      return;
    }
    if (!mediaId) {
      toast.error("آپلود رسانه الزامی است.");
      return;
    }
    await onSubmit({
      Title: title.trim(),
      MediaType: mediaType,
      IsActive: isActive,
      SortOrder: sortOrder,
      Media: mediaId,
      Thumbnail: thumbnailId,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6" dir="rtl">
      <div className="flex flex-row items-center gap-3">
        <h1 className="font-peyda text-lg font-semibold text-zinc-800 lg:text-xl">{heading}</h1>
        <button
          type="button"
          onClick={onBack}
          className="hidden rounded-xl bg-white px-3 py-2 font-peyda text-sm text-zinc-700 shadow-[0_0_14.7px_rgba(0,0,0,0.04)] hover:bg-zinc-50 lg:inline-flex"
        >
          بازگشت
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-2xl bg-white p-5 shadow-[0_0_14.7px_rgba(0,0,0,0.04)]">
            <label className="mb-2 block font-peyda text-sm font-medium text-zinc-700">عنوان</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 font-peyda text-sm outline-none focus:border-[#566D97]"
              placeholder="عنوان استوری"
            />
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-[0_0_14.7px_rgba(0,0,0,0.04)]">
            <label className="mb-3 block font-peyda text-sm font-medium text-zinc-700">رسانه</label>
            {mediaUrl ? (
              <div className="relative inline-flex">
                {mediaType === "video" ? (
                  <video src={resolveMediaUrl(mediaUrl, initialValues?.updatedAt)} controls className="h-56 rounded-xl" />
                ) : (
                  <img src={resolveMediaUrl(mediaUrl, initialValues?.updatedAt)} alt="" className="h-56 rounded-xl object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMediaId(undefined);
                    setMediaUrl(undefined);
                  }}
                  className="absolute -right-2 -top-2 rounded-full bg-rose-500 p-1 text-white"
                  aria-label="حذف رسانه"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={uploadingMedia}
                onClick={() => mediaInputRef.current?.click()}
                className="flex min-h-44 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 font-peyda text-sm text-zinc-400 hover:border-[#98BDFF] hover:text-[#566D97]"
              >
                <Upload className="size-7" aria-hidden />
                {uploadingMedia ? "در حال آپلود..." : "آپلود تصویر یا ویدیو"}
              </button>
            )}
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleMediaUpload(file);
              }}
            />
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-[0_0_14.7px_rgba(0,0,0,0.04)]">
            <label className="mb-3 block font-peyda text-sm font-medium text-zinc-700">تصویر جلد</label>
            {thumbnailUrl ? (
              <div className="relative inline-flex">
                <img src={resolveMediaUrl(thumbnailUrl, initialValues?.updatedAt)} alt="" className="size-32 rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setThumbnailId(undefined);
                    setThumbnailUrl(undefined);
                  }}
                  className="absolute -right-2 -top-2 rounded-full bg-rose-500 p-1 text-white"
                  aria-label="حذف تصویر جلد"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={uploadingThumbnail}
                onClick={() => thumbnailInputRef.current?.click()}
                className="flex h-32 w-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 font-peyda text-sm text-zinc-400 hover:border-[#98BDFF] hover:text-[#566D97]"
              >
                <ImagePlus className="size-6" aria-hidden />
                {uploadingThumbnail ? "در حال آپلود..." : "آپلود جلد"}
              </button>
            )}
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleThumbnailUpload(file);
              }}
            />
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          <section className="rounded-2xl bg-white p-5 shadow-[0_0_14.7px_rgba(0,0,0,0.04)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <span className="font-peyda text-sm font-medium text-zinc-700">وضعیت انتشار</span>
              <button type="button" onClick={() => setIsActive((value) => !value)} className="inline-flex items-center gap-2 font-peyda text-sm">
                {isActive ? (
                  <>
                    <ToggleRight className="size-6 text-emerald-500" aria-hidden />
                    <span className="text-emerald-700">فعال</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="size-6 text-zinc-400" aria-hidden />
                    <span className="text-zinc-500">غیرفعال</span>
                  </>
                )}
              </button>
            </div>
            <Button variant="blue" type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-[0_0_14.7px_rgba(0,0,0,0.04)]">
            <label className="mb-2 block font-peyda text-sm font-medium text-zinc-700">ترتیب نمایش</label>
            <input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(event) => setSortOrder(Number(event.target.value))}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 font-peyda text-sm outline-none focus:border-[#566D97]"
            />
          </section>
        </aside>
      </div>
    </form>
  );
}
