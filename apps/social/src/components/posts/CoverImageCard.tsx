"use client";

/**
 * Cover-image upload card for the create-post flow.
 *
 * Ports the visual structure of the storefront `IndexPhotoUploader`
 * (`apps/frontend/src/components/Product/add/IndexPhotoUploader/index.tsx`) into
 * the social app:
 *
 * - White rounded card with a centred Persian header.
 * - Image preview box whose aspect ratio mirrors the user's chosen post size
 *   (so the preview literally shows the post's silhouette).
 * - Three icon buttons below: edit (active blue gradient), delete (gray),
 *   eye / view (gray) — the "active" treatment mirrors the storefront UI but
 *   uses the social `Button blue` gradient instead of the storefront's pink.
 * - Blue help text below.
 */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Camera, Eye, Pencil, Trash2 } from "lucide-react";
import type { CoverUploadController } from "@/hooks/use-file-upload";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const COVER_TITLE = "تصویر کاور";
const COVER_HINT = "اینجا تصویر کاور را بارگذاری کنید";

const accentButtonClass = cx(
  "relative isolate flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden",
  "rounded-xl border-0 text-white shadow-[0_4px_14px_rgba(57,76,110,0.22)]",
  "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
  "bg-[linear-gradient(180deg,#566D97_0%,#98BDFF_100%)]",
  "hover:bg-[linear-gradient(70.36deg,#3E5070_10.29%,#A0C2FF_74.27%)]",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

const subtleButtonClass = cx(
  "flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border-0",
  "bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export type CoverImageCardProps = {
  controller: CoverUploadController;
  /** Aspect ratio source: the chosen post size in CSS-friendly w / h numbers. */
  aspectRatio: { w: number; h: number };
};

export function CoverImageCard({ controller, aspectRatio }: CoverImageCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
  }, []);

  const openPicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) controller.setFile(file);
    e.target.value = "";
  };

  const handlePreview = () => {
    if (!controller.preview) return;
    window.open(controller.preview, "_blank", "noopener,noreferrer");
  };

  const aspectStyle = {
    aspectRatio: `${aspectRatio.w} / ${aspectRatio.h}`,
  } as const;

  return (
    <div className="flex w-full flex-col items-center gap-3 rounded-2xl bg-white px-5 py-6 shadow-[0_0_14.7px_rgba(0,0,0,0.04)]">
      <h3 className="font-peyda text-sm text-zinc-700">{COVER_TITLE}</h3>

      <button
        type="button"
        onClick={openPicker}
        aria-label={controller.hasMedia ? "تغییر تصویر کاور" : "افزودن تصویر کاور"}
        style={{ ...aspectStyle, maxHeight: 320 }}
        className={cx(
          "relative flex w-full cursor-pointer items-center justify-center overflow-hidden",
          "rounded-2xl border-0 bg-[rgba(140,174,236,0.14)] transition-colors hover:bg-[rgba(140,174,236,0.2)]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
        )}
      >
        {controller.preview ? (
          <Image
            src={controller.preview}
            alt="پیش‌نمایش تصویر کاور"
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 320px"
          />
        ) : (
          <Camera className="size-14 text-zinc-400" aria-hidden />
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div dir="ltr" className="flex flex-row items-center gap-2">
        <button
          type="button"
          className={accentButtonClass}
          onClick={openPicker}
          aria-label={controller.hasMedia ? "تعویض تصویر کاور" : "افزودن تصویر کاور"}
        >
          <Pencil className="size-5 stroke-[1.5]" aria-hidden />
        </button>
        <button
          type="button"
          className={subtleButtonClass}
          onClick={controller.clear}
          disabled={!controller.hasMedia}
          aria-label="حذف تصویر کاور"
        >
          <Trash2 className="size-5 stroke-[1.5]" aria-hidden />
        </button>
        <button
          type="button"
          className={subtleButtonClass}
          onClick={handlePreview}
          disabled={!controller.preview}
          aria-label="پیش‌نمایش تصویر کاور"
        >
          <Eye className="size-5 stroke-[1.5]" aria-hidden />
        </button>
      </div>

      <p className="font-peyda text-xs text-[#566D97]">{COVER_HINT}</p>
    </div>
  );
}
