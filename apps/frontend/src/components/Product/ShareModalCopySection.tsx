import { RefObject } from "react";

interface ShareModalCopySectionProps {
  open: boolean;
  shareUrl: string;
  copied: "link" | "text" | null;
  canNativeShare: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onCopyText: () => void;
  onCopyLink: () => void;
  onNativeShare: () => void;
  onSelectInput: () => void;
}

export default function ShareModalCopySection({
  open,
  shareUrl,
  copied,
  canNativeShare,
  inputRef,
  onCopyText,
  onCopyLink,
  onNativeShare,
  onSelectInput,
}: ShareModalCopySectionProps) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">لینک مستقیم</p>

        <button
          type="button"
          onClick={onCopyText}
          disabled={!shareUrl}
          className="text-xs font-semibold text-infinity-primary transition hover:text-infinity-primary-dark disabled:opacity-60"
        >
          {copied === "text" ? "کپی شد" : "کپی متن پیام"}
        </button>
      </div>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={shareUrl}
          readOnly
          dir="ltr"
          onClick={onSelectInput}
          placeholder={open ? "در حال آماده‌سازی لینک..." : ""}
          className="h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none ring-0 focus:border-infinity-primary-lighter"
          aria-label="لینک اشتراک‌گذاری"
        />
        <button
          type="button"
          onClick={onCopyLink}
          disabled={!shareUrl}
          className="h-12 shrink-0 rounded-xl bg-infinity-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-infinity-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {copied === "link" ? "کپی شد" : "کپی"}
        </button>
      </div>

      {canNativeShare && (
        <button
          type="button"
          onClick={onNativeShare}
          disabled={!shareUrl}
          className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-gray-800 ring-1 ring-black/10 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          گزینه‌های بیشتر (اشتراک‌گذاری سیستمی)
        </button>
      )}
    </div>
  );
}
