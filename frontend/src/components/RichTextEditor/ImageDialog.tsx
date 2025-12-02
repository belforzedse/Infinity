"use client";

import React from "react";
import Modal from "@/components/Kits/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IMAGE_BASE_URL } from "@/constants/api";
import type { UploadedImage } from "@/services/super-admin/files/upload";
import { listFiles } from "@/services/super-admin/files/list";
import { uploadFile } from "@/services/super-admin/files/upload";
import { toast } from "react-hot-toast";

export interface ImageFormValues {
  src: string;
  alt?: string;
  title?: string;
  width?: string;
  height?: string;
}

interface ImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues: ImageFormValues;
  onSubmit: (values: ImageFormValues, media?: UploadedImage | null) => void;
}

type TabKey = "library" | "url";

const defaultValues: ImageFormValues = {
  src: "",
  alt: "",
  title: "",
  width: "",
  height: "",
};

const resolveImageUrl = (file: UploadedImage): string => {
  if (!file) {
    return "";
  }

  if (file.url.startsWith("http")) {
    return file.url;
  }
  return `${IMAGE_BASE_URL}${file.url}`;
};

const ImageDialog: React.FC<ImageDialogProps> = ({
  isOpen,
  onClose,
  initialValues,
  onSubmit,
}) => {
  const [values, setValues] = React.useState<ImageFormValues>(initialValues ?? defaultValues);
  const [errors, setErrors] = React.useState<{ src?: string }>({});
  const [activeTab, setActiveTab] = React.useState<TabKey>("library");
  const [mediaItems, setMediaItems] = React.useState<UploadedImage[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [selectedMediaId, setSelectedMediaId] = React.useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = React.useState<UploadedImage | null>(null);

  const loadMediaLibrary = React.useCallback(async () => {
    setIsLoadingMedia(true);
    try {
      const files = await listFiles({ pageSize: 40 });
      setMediaItems(Array.isArray(files) ? files : []);
    } catch (error) {
      // listFiles toast already handles the error
    } finally {
      setIsLoadingMedia(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    setValues(initialValues ?? defaultValues);
    setErrors({});
    setSelectedMediaId(null);
    setSelectedMedia(null);

    // Preload media on first open
    if (!mediaItems.length) {
      loadMediaLibrary();
    }
  }, [initialValues, isOpen, loadMediaLibrary, mediaItems.length]);

  const handleSelectMedia = (file: UploadedImage) => {
    setSelectedMediaId(file.id);
    setSelectedMedia(file);
    setValues((prev) => ({
      ...prev,
      src: resolveImageUrl(file),
      alt: file.alternativeText ?? file.caption ?? prev.alt ?? file.name,
      width: file.width ? String(file.width) : prev.width,
      height: file.height ? String(file.height) : prev.height,
    }));
    setErrors((prev) => ({ ...prev, src: undefined }));
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("فایل انتخابی باید تصویر باشد");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadFile(file);
      if (result && result.length > 0) {
        const uploaded = result[0];
        setMediaItems((prev) => [uploaded, ...prev]);
        handleSelectMedia(uploaded);
        setActiveTab("library");
        toast.success("تصویر با موفقیت آپلود شد");
      }
    } catch (error) {
      toast.error("آپلود تصویر ناموفق بود");
    } finally {
      setIsUploading(false);
      // reset file input so same file can be selected again
      event.target.value = "";
    }
  };

  const handleFieldChange = (field: keyof ImageFormValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (field === "src" && value) {
      setErrors((prev) => ({ ...prev, src: undefined }));
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!values.src.trim()) {
      setErrors({ src: "تصویر را انتخاب یا آدرس را وارد کنید" });
      return;
    }

    onSubmit(
      {
        ...values,
        src: values.src.trim(),
        alt: values.alt?.trim(),
        title: values.title?.trim(),
        width: values.width?.trim(),
        height: values.height?.trim(),
      },
      selectedMedia,
    );
    onClose();
  };

  const renderMediaGrid = () => {
    if (isLoadingMedia) {
      return (
        <div className="py-6 text-center text-sm text-neutral-500">در حال دریافت تصاویر...</div>
      );
    }

    if (!mediaItems.length) {
      return (
        <div className="py-6 text-center text-sm text-neutral-500">
          تصویری در کتابخانه پیدا نشد. برای افزودن، روی دکمه آپلود کلیک کنید.
        </div>
      );
    }

    return (
      <div className="grid max-h-[320px] grid-cols-2 gap-3 overflow-y-auto md:grid-cols-3">
        {mediaItems.map((file) => {
          const preview = file.formats?.thumbnail?.url ?? file.url;
          const previewUrl = preview.startsWith("http") ? preview : `${IMAGE_BASE_URL}${preview}`;
          const isSelected = selectedMediaId === file.id;

          return (
            <button
              key={file.id}
              type="button"
              onClick={() => handleSelectMedia(file)}
              className={`flex flex-col items-center rounded-lg border bg-white p-2 text-xs transition ${
                isSelected ? "border-pink-500 shadow-sm" : "border-neutral-200 hover:border-pink-200"
              }`}
            >
              <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-md bg-neutral-50">
                <img
                  src={previewUrl}
                  alt={file.alternativeText ?? file.name}
                  className="max-h-full w-auto object-contain"
                />
              </div>
              <span className="mt-2 line-clamp-2 text-center text-[11px] text-neutral-600">
                {file.name}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="افزودن تصویر" className="max-w-4xl">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 rounded-xl bg-neutral-50 p-2 text-sm font-medium text-neutral-700">
          {(["library", "url"] as TabKey[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg px-3 py-2 transition ${
                activeTab === tab ? "bg-white text-pink-600 shadow-sm" : "text-neutral-500"
              }`}
            >
              {tab === "library" ? "کتابخانه رسانه" : "آدرس مستقیم"}
            </button>
          ))}
        </div>

        {activeTab === "library" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:border-pink-300">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
                {isUploading ? "در حال آپلود..." : "آپلود تصویر جدید"}
              </label>
              <Button type="button" variant="outline" size="sm" onClick={loadMediaLibrary}>
                بروزرسانی لیست
              </Button>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-3">
              {renderMediaGrid()}
            </div>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              آدرس تصویر (URL)
            </label>
            <Input
              dir="ltr"
              value={values.src}
              onChange={(e) => handleFieldChange("src", e.target.value)}
              placeholder="https://cdn.example.com/image.jpg"
              error={errors.src}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">متن جایگزین</label>
            <Input
              value={values.alt}
              onChange={(e) => handleFieldChange("alt", e.target.value)}
              placeholder="برای توضیح تصویر وارد کنید"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">عنوان (title)</label>
            <Input
              value={values.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder="عنوان اختیاری"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">عرض (px)</label>
            <Input
              type="number"
              inputMode="numeric"
              dir="ltr"
              value={values.width}
              onChange={(e) => handleFieldChange("width", e.target.value)}
              placeholder="مثال: 800"
              min={0}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">ارتفاع (px)</label>
            <Input
              type="number"
              inputMode="numeric"
              dir="ltr"
              value={values.height}
              onChange={(e) => handleFieldChange("height", e.target.value)}
              placeholder="مثال: 600"
              min={0}
            />
          </div>
        </div>

        {values.src && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <p className="mb-2 text-xs text-neutral-500">پیش نمایش تصویر</p>
            <div className="flex max-h-72 items-center justify-center overflow-hidden rounded-lg bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={values.src}
                alt={values.alt || "preview"}
                className="max-h-72 w-auto object-contain"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" variant="primary">
            افزودن تصویر
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ImageDialog;
