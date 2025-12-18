"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/Kits/Modal";
import BlurImage from "@/components/ui/BlurImage";
import notify from "@/utils/notify";
import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  TelegramIcon,
  TelegramShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";

export type ShareProduct = {
  id: number;
  title: string;
  slug?: string;
  imageUrl?: string;
  price?: number;
  discountPrice?: number;

  // Optional: show selected variant as a small pill/line (e.g. "مشکی • XL")
  variantLabel?: string;
};

export interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ShareProduct;

  /**
   * Optional: override the PDP path builder if your routes differ.
   * Example: (p) => `/product/${p.slug ?? p.id}`
   */
  buildPath?: (product: ShareProduct) => string;

  /**
   * Optional: append basic UTM params to the share URL (default true).
   */
  withUtm?: boolean;

  /**
   * Optional: auto-close modal after clicking a share target (default true).
   */
  closeOnShareClick?: boolean;
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // Prefer async clipboard API (secure context)
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back below
    }
  }

  // Fallback: execCommand copy
  if (typeof document === "undefined") return false;

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function formatFaPrice(value: number) {
  return value.toLocaleString("fa-IR");
}

export default function ShareModal({
  open,
  onOpenChange,
  product,
  buildPath,
  withUtm = true,
  closeOnShareClick = true,
}: ShareModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const productPath = useMemo(() => {
    if (buildPath) return buildPath(product);

    const slugOrId = product.slug?.trim() ? product.slug.trim() : String(product.id);
    return `/pdp/${slugOrId}`;
  }, [buildPath, product]);

  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState<"link" | "text" | null>(null);

  // Web Share API support (native OS share sheet)
  const canNativeShare = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return typeof navigator.share === "function";
  }, []);

  const displayPrice = useMemo(() => {
    if (typeof product.discountPrice === "number" && product.discountPrice > 0) {
      return product.discountPrice;
    }
    if (typeof product.price === "number" && product.price > 0) return product.price;
    return undefined;
  }, [product.discountPrice, product.price]);

  const hasDiscount = useMemo(() => {
    if (typeof product.price !== "number" || typeof product.discountPrice !== "number")
      return false;
    return product.discountPrice > 0 && product.discountPrice < product.price;
  }, [product.price, product.discountPrice]);

  // Compute full share URL only on the client (SSR-safe)
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;

    const url = new URL(productPath, window.location.origin);

    if (withUtm) {
      url.searchParams.set("utm_source", "share");
      url.searchParams.set("utm_medium", "modal");
      url.searchParams.set("utm_campaign", "product_share");
    }

    setShareUrl(url.toString());
  }, [open, productPath, withUtm]);

  // Reset transient UI state when closing
  useEffect(() => {
    if (!open) {
      setCopied(null);
      setShareUrl("");
    }
  }, [open]);

  // Focus the URL input once URL is ready
  useEffect(() => {
    if (!open) return;
    if (!shareUrl) return;
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
    return () => clearTimeout(t);
  }, [open, shareUrl]);

  // A richer share message (useful for WhatsApp/Telegram/Email)
  const shareText = useMemo(() => {
    if (!shareUrl) return "";

    const lines: string[] = [];
    lines.push(product.title);

    if (product.variantLabel?.trim()) {
      lines.push(`گزینه: ${product.variantLabel.trim()}`);
    }

    if (typeof displayPrice === "number") {
      const priceLine =
        hasDiscount && typeof product.price === "number"
          ? `قیمت: ${formatFaPrice(displayPrice)} تومان (قبل: ${formatFaPrice(product.price)} تومان)`
          : `قیمت: ${formatFaPrice(displayPrice)} تومان`;
      lines.push(priceLine);
    }

    lines.push("");
    lines.push(shareUrl);

    return lines.join("\n");
  }, [shareUrl, product.title, product.variantLabel, displayPrice, hasDiscount, product.price]);

  const closeSoon = useCallback(() => {
    if (!closeOnShareClick) return;
    // Small delay helps ensure the share popup/navigation triggers reliably
    setTimeout(() => onOpenChange(false), 80);
  }, [closeOnShareClick, onOpenChange]);

  const handleCopyLink = useCallback(async () => {
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopied("link");
      notify.success("لینک کپی شد");
      setTimeout(() => setCopied(null), 1200);
    } else {
      notify.error("کپی لینک ناموفق بود");
    }
  }, [shareUrl]);

  const handleCopyText = useCallback(async () => {
    const ok = await copyToClipboard(shareText);
    if (ok) {
      setCopied("text");
      notify.success("متن پیام کپی شد");
      setTimeout(() => setCopied(null), 1200);
    } else {
      notify.error("کپی متن ناموفق بود");
    }
  }, [shareText]);

  const handleOpenLink = useCallback(() => {
    if (!shareUrl || typeof window === "undefined") return;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }, [shareUrl]);

  const handleNativeShare = useCallback(async () => {
    if (!shareUrl) return;
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") return;

    try {
      await navigator.share({
        title: product.title,
        text: shareText,
        url: shareUrl,
      });
      onOpenChange(false);
    } catch {
      // User may cancel; do nothing
    }
  }, [shareUrl, shareText, product.title, onOpenChange]);

  const handleSelectInput = useCallback(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      className="max-w-2xl !p-0"
      title="اشتراک‌گذاری"
      aria-labelledby="share-modal-title"
    >
      {/* Scrollable body + sticky actions on mobile */}
      <div className="flex max-h-[85vh] flex-col">
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Product preview */}
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-neutral-50 p-3 ring-1 ring-black/5">
            <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
              {product.imageUrl ? (
                <BlurImage
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs font-semibold text-gray-500">
                  {product.title?.slice?.(0, 1) ?? "—"}
                </div>
              )}

              {hasDiscount && (
                <span className="absolute left-1 top-1 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  تخفیف
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{product.title}</p>

              {product.variantLabel?.trim() && (
                <p className="mt-0.5 truncate text-xs text-gray-600">
                  {product.variantLabel.trim()}
                </p>
              )}

              {typeof displayPrice === "number" && (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold text-gray-800">
                    {formatFaPrice(displayPrice)} تومان
                  </p>
                  {hasDiscount && typeof product.price === "number" && (
                    <p className="text-xs text-gray-500 line-through">
                      {formatFaPrice(product.price)} تومان
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleOpenLink}
              disabled={!shareUrl}
              className="h-10 shrink-0 rounded-xl bg-white px-3 text-xs font-semibold text-gray-700 ring-1 ring-black/10 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              باز کردن
            </button>
          </div>

          {/* Copy link */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-gray-900">لینک مستقیم</p>

              <button
                type="button"
                onClick={handleCopyText}
                disabled={!shareUrl}
                className="text-xs font-semibold text-pink-600 transition hover:text-pink-700 disabled:opacity-60"
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
                onClick={handleSelectInput}
                placeholder={open ? "در حال آماده‌سازی لینک..." : ""}
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none ring-0 focus:border-pink-300"
                aria-label="لینک اشتراک‌گذاری"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                disabled={!shareUrl}
                className="h-12 shrink-0 rounded-xl bg-pink-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {copied === "link" ? "کپی شد" : "کپی"}
              </button>
            </div>

            {/* Optional native share CTA */}
            {canNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                disabled={!shareUrl}
                className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-gray-800 ring-1 ring-black/10 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                گزینه‌های بیشتر (Share گوشی)
              </button>
            )}
          </div>

          {/* Share grid */}
          <div>
            <p className="mb-3 text-sm font-semibold text-gray-900">ارسال به</p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <WhatsappShareButton
                url={shareUrl}
                title={shareText}
                separator=" "
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white ring-1 ring-black/5 transition hover:ring-pink-200 disabled:opacity-60"
                disabled={!shareUrl}
                onClick={closeSoon}
              >
                <WhatsappIcon size={34} round />
                <span className="text-sm font-medium text-gray-800">واتساپ</span>
              </WhatsappShareButton>

              <TelegramShareButton
                url={shareUrl}
                title={shareText}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white ring-1 ring-black/5 transition hover:ring-pink-200 disabled:opacity-60"
                disabled={!shareUrl}
                onClick={closeSoon}
              >
                <TelegramIcon size={34} round />
                <span className="text-sm font-medium text-gray-800">تلگرام</span>
              </TelegramShareButton>

              <TwitterShareButton
                url={shareUrl}
                title={shareText}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white ring-1 ring-black/5 transition hover:ring-pink-200 disabled:opacity-60"
                disabled={!shareUrl}
                onClick={closeSoon}
              >
                <TwitterIcon size={34} round />
                <span className="text-sm font-medium text-gray-800">ایکس</span>
              </TwitterShareButton>

              <FacebookShareButton
                url={shareUrl}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white ring-1 ring-black/5 transition hover:ring-pink-200 disabled:opacity-60"
                disabled={!shareUrl}
                onClick={closeSoon}
              >
                <FacebookIcon size={34} round />
                <span className="text-sm font-medium text-gray-800">فیسبوک</span>
              </FacebookShareButton>

              <LinkedinShareButton
                url={shareUrl}
                title={product.title}
                summary={shareText}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white ring-1 ring-black/5 transition hover:ring-pink-200 disabled:opacity-60"
                disabled={!shareUrl}
                onClick={closeSoon}
              >
                <LinkedinIcon size={34} round />
                <span className="text-sm font-medium text-gray-800">لینکدین</span>
              </LinkedinShareButton>

              <EmailShareButton
                url={shareUrl}
                subject={product.title}
                body={shareText}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white ring-1 ring-black/5 transition hover:ring-pink-200 disabled:opacity-60"
                disabled={!shareUrl}
                onClick={closeSoon}
              >
                <EmailIcon size={34} round />
                <span className="text-sm font-medium text-gray-800">ایمیل</span>
              </EmailShareButton>
            </div>
          </div>
        </div>

        {/* Sticky footer hint (mobile polish) */}
        <div className="border-t border-black/5 bg-white/80 px-6 py-3 backdrop-blur sm:hidden">
          <p className="text-center text-xs text-gray-600">
            برای ارسال در اینستاگرام/دایرکت، بهترین گزینه «کپی لینک» است.
          </p>
        </div>
      </div>
    </Modal>
  );
}
