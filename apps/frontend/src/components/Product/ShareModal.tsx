"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/Kits/Modal";
import ShareButtonsGrid from "@/components/Product/ShareButtonsGrid";
import ShareModalCopySection from "@/components/Product/ShareModalCopySection";
import ShareModalProductPreview from "@/components/Product/ShareModalProductPreview";
import { copyToClipboard } from "@/utils/clipboard";
import notify from "@/utils/notify";
import { priceFormatter } from "@/utils/price";

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
          ? `قیمت: ${priceFormatter(displayPrice)} تومان (قبل: ${priceFormatter(product.price)} تومان)`
          : `قیمت: ${priceFormatter(displayPrice)} تومان`;
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
          <ShareModalProductPreview
            title={product.title}
            imageUrl={product.imageUrl}
            variantLabel={product.variantLabel}
            displayPrice={displayPrice}
            originalPrice={product.price}
            hasDiscount={hasDiscount}
            shareUrl={shareUrl}
            onOpenLink={handleOpenLink}
          />

          {/* Copy link */}
          <ShareModalCopySection
            open={open}
            shareUrl={shareUrl}
            copied={copied}
            canNativeShare={canNativeShare}
            inputRef={inputRef}
            onCopyText={handleCopyText}
            onCopyLink={handleCopyLink}
            onNativeShare={handleNativeShare}
            onSelectInput={handleSelectInput}
          />

          {/* Share grid */}
          <ShareButtonsGrid
            shareUrl={shareUrl}
            shareText={shareText}
            productTitle={product.title}
            onShareClick={closeSoon}
          />
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
