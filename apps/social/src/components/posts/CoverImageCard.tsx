"use client";

/**
 * Cover-image upload card for the create-post flow.
 */

import { useRef } from "react";
import Image from "next/image";
import {
  Camera,
  CheckCircle2,
  Eye,
  Loader2,
  Pencil,
  RefreshCcw,
  Trash2,
  XCircle,
} from "lucide-react";
import type { CoverUploadController } from "@/hooks/use-file-upload";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const COVER_TITLE = "تصویر کاور";
const COVER_HINT = "اینجا تصویر کاور را بارگذاری کنید";
const STATUS_LABELS = {
  uploading: "در حال آپلود",
  uploaded: "آپلود شد",
  failed: "آپلود ناموفق",
} as const;

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
          <>
            <Image
              src={controller.preview}
              alt="پیش نمایش تصویر کاور"
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 320px"
            />
            {controller.uploadStatus !== "idle" ? (
              <span
                className={cx(
                  "pointer-events-none absolute bottom-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-full",
                  "px-2.5 py-1 font-peyda text-[11px] text-white shadow-sm",
                  controller.uploadStatus === "uploaded" && "bg-emerald-600/90",
                  controller.uploadStatus === "uploading" && "bg-[#3D4C6E]/90",
                  controller.uploadStatus === "failed" && "bg-red-600/90",
                )}
              >
                {controller.uploadStatus === "uploaded" ? (
                  <CheckCircle2 className="size-3.5 stroke-[2]" aria-hidden />
                ) : null}
                {controller.uploadStatus === "uploading" ? (
                  <Loader2 className="size-3.5 animate-spin stroke-[2]" aria-hidden />
                ) : null}
                {controller.uploadStatus === "failed" ? (
                  <XCircle className="size-3.5 stroke-[2]" aria-hidden />
                ) : null}
                {STATUS_LABELS[controller.uploadStatus]}
              </span>
            ) : null}
          </>
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
          aria-label="پیش نمایش تصویر کاور"
        >
          <Eye className="size-5 stroke-[1.5]" aria-hidden />
        </button>
        {controller.hasFailed ? (
          <button
            type="button"
            className={subtleButtonClass}
            onClick={controller.retry}
            aria-label="تلاش دوباره برای آپلود کاور"
          >
            <RefreshCcw className="size-5 stroke-[1.5]" aria-hidden />
          </button>
        ) : null}
      </div>

      <p className={cx("font-peyda text-xs", controller.hasFailed ? "text-red-600" : "text-[#566D97]")}>
        {controller.uploadError ?? COVER_HINT}
      </p>
    </div>
  );
}
