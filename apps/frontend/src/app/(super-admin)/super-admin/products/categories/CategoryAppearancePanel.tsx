"use client";

import { useEffect, useRef, useState } from "react";
import { Droplet, ImageIcon, Plus, X } from "lucide-react";
import { HexColorInput, HexColorPicker } from "react-colorful";
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
  color: string;
  onColorChange: (value: string) => void;
};

const isValidHex = (value: string) => /^#([0-9a-f]{6})$/i.test(value);

export default function CategoryAppearancePanel({
  image,
  onImageChange,
  color,
  onColorChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [noColor, setNoColor] = useState(!color.trim());
  const [lastColor, setLastColor] = useState("#ffffff");

  const normalizedColor = color.trim();
  const colorPickerValue = isValidHex(normalizedColor) ? normalizedColor : lastColor;

  useEffect(() => {
    const hasColor = Boolean(normalizedColor);
    setNoColor(!hasColor);
    if (isValidHex(normalizedColor)) {
      setLastColor(normalizedColor);
    }
  }, [normalizedColor]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploaded = await uploadFile(file);
      if (uploaded && uploaded.length > 0) {
        const img = uploaded[0];
        const bestUrl =
          img.formats?.medium?.url ||
          img.formats?.small?.url ||
          img.formats?.large?.url ||
          img.formats?.thumbnail?.url ||
          img.url;
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
        <span className="text-sm font-medium text-neutral-800">نمای ظاهری دسته‌بندی</span>
      </div>

      <div className="flex flex-col gap-3">
        {image?.url ? (
          <div className="relative">
            <img
              src={resolveAssetUrl(image.url)}
              alt="تصویر دسته‌بندی"
              className="h-44 w-full rounded-xl object-cover"
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
            className="flex h-44 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-infinity-primary-lighter hover:bg-infinity-primary-lighter/20"
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

      <div className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-800">
          <Droplet className="h-4 w-4 text-slate-500" />
          <span>رنگ دسته‌بندی</span>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/70 p-3">
          <input
            id="category-no-color"
            type="checkbox"
            checked={noColor}
            onChange={(e) => {
              const checked = e.target.checked;
              setNoColor(checked);
              if (checked) {
                onColorChange("");
              } else {
                onColorChange(isValidHex(normalizedColor) ? normalizedColor : lastColor);
              }
            }}
            className="h-4 w-4 rounded border-slate-300 text-infinity-primary focus:ring-infinity-primary"
          />
          <label htmlFor="category-no-color" className="text-sm text-neutral-700">
            بدون رنگ
          </label>
        </div>

        {!noColor ? (
          <>
            <div>
              <label className="text-sm font-medium text-neutral-700">انتخاب از پالت</label>
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                <HexColorPicker
                  color={colorPickerValue}
                  onChange={(value) => onColorChange(value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700">کد HEX</label>
              <HexColorInput
                prefixed
                color={colorPickerValue}
                onChange={(value) => onColorChange(value)}
                aria-label="کد رنگ"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm uppercase focus:border-infinity-primary focus:outline-none focus:ring-1 focus:ring-infinity-primary/30"
              />
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-slate-300 bg-slate-100 p-6 text-center text-sm text-slate-600">
            برای تعیین رنگ گزینه بدون رنگ را خاموش کنید
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-xs font-medium text-neutral-600">پیش‌نمایش رنگ</p>
          <div className="flex items-center gap-3">
            <span
              className="h-14 w-14 rounded-lg border-2 border-slate-300"
              style={{ backgroundColor: noColor ? "transparent" : colorPickerValue }}
              aria-hidden="true"
            />
            <div className="text-sm">
              <p className="font-semibold text-neutral-800">
                {noColor ? "بدون رنگ" : colorPickerValue.toUpperCase()}
              </p>
              <p className="mt-1 text-xs text-neutral-500">در کارت والد نمایش داده می‌شود</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
