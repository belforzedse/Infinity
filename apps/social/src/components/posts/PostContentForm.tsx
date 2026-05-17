"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { CaptionEditor } from "@/components/posts/CaptionEditor";
import { CoverImageCard } from "@/components/posts/CoverImageCard";
import { PostFieldsRow } from "@/components/posts/PostFieldsRow";
import { PostGalleryCard } from "@/components/posts/PostGalleryCard";
import Text from "@/components/Kits/Text";
import { COVER_ASPECT_BY_CODE, type PostCreateSizeCode } from "@/components/posts/post-size-config";
import {
  useCoverUpload,
  useGalleryUpload,
  type ExistingUploadedMedia,
} from "@/hooks/use-file-upload";
import { slugifyBody } from "@/utils/post-slug";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

export type PostContentFormInitialValue = {
  title?: string;
  slug?: string;
  productLink?: string;
  description?: string;
  cover?: ExistingUploadedMedia | null;
  media?: readonly ExistingUploadedMedia[];
};

export type PostContentFormSubmitInput = {
  title: string;
  slug: string;
  productLink?: string;
  description: string;
  coverId: number;
  mediaIds: number[];
};

export type PostContentFormProps = {
  size: PostCreateSizeCode;
  heading: string;
  submitText: string;
  submittingText: string;
  submitAriaLabel: string;
  cancelAriaLabel: string;
  successMessage: string;
  errorMessage: string;
  initialValue?: PostContentFormInitialValue;
  onBack: () => void;
  onCancel: () => void;
  onSubmit: (input: PostContentFormSubmitInput) => Promise<void>;
};

function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

export function PostContentForm({
  size,
  heading,
  submitText,
  submittingText,
  submitAriaLabel,
  cancelAriaLabel,
  successMessage,
  errorMessage,
  initialValue,
  onBack,
  onCancel,
  onSubmit,
}: PostContentFormProps) {
  const [title, setTitle] = useState(initialValue?.title ?? "");
  const [slug, setSlug] = useState(initialValue?.slug ?? "");
  const [slugDirty, setSlugDirty] = useState(Boolean(initialValue?.slug));
  const [productLink, setProductLink] = useState(initialValue?.productLink ?? "");
  const [captionHtml, setCaptionHtml] = useState(initialValue?.description ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cover = useCoverUpload(initialValue?.cover ?? null);
  const gallery = useGalleryUpload(initialValue?.media ?? []);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugDirty) {
      setSlug(slugifyBody(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugDirty(true);
  };

  const canSubmit =
    title.trim().length > 0 &&
    cover.hasMedia &&
    gallery.items.length >= 1 &&
    stripHtml(captionHtml).length > 0 &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const trimmedTitle = title.trim();
    const trimmedLink = productLink.trim();
    const captionForWire = captionHtml.trim();

    setIsSubmitting(true);
    try {
      const [coverId, mediaIds] = await Promise.all([
        cover.upload(),
        gallery.uploadAll(),
      ]);

      await onSubmit({
        title: trimmedTitle,
        slug: slug.trim(),
        description: captionForWire,
        coverId,
        mediaIds,
        productLink: trimmedLink || undefined,
      });

      toast.success(successMessage);
    } catch (error: unknown) {
      toast.error(getUserFacingErrorMessage(error, errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-8 lg:gap-10">
      <div className="flex w-full flex-row items-center gap-3">
        <h1 className="font-peyda text-lg font-semibold text-zinc-800 lg:text-xl">
          {heading}
        </h1>
        <button
          type="button"
          onClick={onBack}
          aria-label="بازگشت به مرحله ی قبل"
          className="hidden h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-700 shadow-[0_0_14.7px_rgba(0,0,0,0.04)] transition-colors hover:bg-zinc-50 lg:inline-flex"
        >
          <ArrowRight size={18} strokeWidth={1.8} aria-hidden />
        </button>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="order-1 lg:col-span-1">
          <CoverImageCard controller={cover} aspectRatio={COVER_ASPECT_BY_CODE[size]} />
        </div>
        <div className="order-2 lg:col-span-2">
          <PostGalleryCard controller={gallery} />
        </div>
      </div>

      <PostFieldsRow
        title={title}
        onTitleChange={handleTitleChange}
        slug={slug}
        onSlugChange={handleSlugChange}
        productLink={productLink}
        onProductLinkChange={setProductLink}
        disabled={isSubmitting}
      />

      <div className="space-y-2">
        <label htmlFor="post-caption" className="block text-right">
          <Text variant="label" className="!text-sm !text-zinc-600">
            کپشن
          </Text>
        </label>
        <div id="post-caption">
          <CaptionEditor
            value={captionHtml}
            onChange={setCaptionHtml}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 [&>button]:w-full lg:flex lg:flex-row lg:justify-end lg:[&>button]:w-auto">
        <Button
          variant="blue"
          disabled={!canSubmit}
          onClick={handleSubmit}
          aria-label={submitAriaLabel}
        >
          {isSubmitting ? submittingText : submitText}
        </Button>
        <Button
          variant="default"
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label={cancelAriaLabel}
        >
          انصراف
        </Button>
      </div>
    </div>
  );
}
